import { useState, type ChangeEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileImage, FileText, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { fetchMedia, getMediaFileUrl } from '@/services/media.service';
import type { MediaAsset } from '@/services/media.service';
import type { ContentTypeField, FieldType } from '@/types/content-type';

export type DynamicFieldValue = string | boolean;

interface DynamicFieldInputProps {
  field: ContentTypeField;
  value: DynamicFieldValue;
  error?: string;
  onChange: (value: DynamicFieldValue) => void;
}

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

function getTextInputType(type: FieldType): 'text' | 'email' | 'number' | 'date' {
  switch (type) {
    case 'short_text':
      return 'text';
    case 'email':
    case 'number':
    case 'date':
      return type;
    default:
      return 'text';
  }
}

function renderFieldInput(
  field: ContentTypeField,
  value: DynamicFieldValue,
  onChange: DynamicFieldInputProps['onChange'],
  error?: string,
): ReactNode {
  const id = `entry-${field.name}`;
  const required = field.required;
  const fieldClass = error
    ? `${inputClass} border-rose-500 focus:border-rose-500 focus:ring-rose-500`
    : inputClass;

  switch (field.type) {
    case 'long_text':
      return (
        <textarea
          id={id}
          className={fieldClass}
          rows={5}
          value={String(value)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'boolean':
      return (
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => onChange(event.target.checked)}
          />
          {value ? 'Yes' : 'No'}
        </label>
      );
    case 'enumeration':
      return (
        <select
          id={id}
          className={fieldClass}
          value={String(value)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose an option</option>
          {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    case 'media':
      return (
        <MediaFieldInput id={id} value={String(value)} required={required} error={error} onChange={onChange} />
      );
    case 'short_text':
    case 'number':
    case 'date':
    case 'email': {
      const inputType = getTextInputType(field.type);
      return (
        <input
          id={id}
          className={fieldClass}
          type={inputType}
          step={inputType === 'number' ? 'any' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={String(value)}
          required={required}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
      );
    }
    default: {
      const unsupportedType: never = field.type;
      throw new Error(`Unsupported field type: ${unsupportedType}`);
    }
  }
}

function MediaFieldInput({
  id,
  value,
  required,
  error,
  onChange,
}: {
  id: string;
  value: string;
  required: boolean;
  error?: string;
  onChange: DynamicFieldInputProps['onChange'];
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const mediaQuery = useQuery({ queryKey: ['media'], queryFn: fetchMedia });
  const selectedMedia = mediaQuery.data?.find((media) => media.stored_path === value);
  const previewUrl = value ? getMediaFileUrl(value) : null;
  const isImage = previewUrl && /\.(jpe?g|png|webp|gif)(?:$|\?)/i.test(value);
  const isPdf = /\.pdf(?:$|\?)/i.test(value);
  const Icon = isPdf ? FileText : isImage ? Image : FileImage;

  return (
    <>
      <div id={id} className={`mt-1 rounded-lg border p-3 ${error ? 'border-rose-500' : 'border-slate-300'}`} aria-invalid={Boolean(error)} aria-required={required}>
        {value ? (
          <div className="flex items-center gap-3">
            {previewUrl && isImage ? <img src={previewUrl} alt="Selected media preview" className="h-14 w-14 rounded-md object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-indigo-500"><Icon className="h-7 w-7" /></div>}
            <p className="min-w-0 flex-1 truncate text-sm text-slate-700" title={selectedMedia?.file_name ?? value}>{selectedMedia?.file_name ?? value.split(/[\\/]/).pop()}</p>
            <Button type="button" variant="ghost" size="sm" aria-label="Remove selected media" onClick={() => onChange('')}><X className="h-4 w-4" /></Button>
          </div>
        ) : <p className="text-sm text-slate-500">No media selected{required ? ' (required)' : ''}.</p>}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setIsPickerOpen(true)}>{value ? 'Change media' : 'Choose media'}</Button>
      </div>
      {isPickerOpen && <MediaPickerModal onClose={() => setIsPickerOpen(false)} onSelect={(media: MediaAsset) => { onChange(media.stored_path); setIsPickerOpen(false); }} />}
    </>
  );
}

export function DynamicFieldInput({ field, value, error, onChange }: DynamicFieldInputProps) {
  const id = `entry-${field.name}`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {field.name}{field.required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {renderFieldInput(field, value, onChange, error)}
      {error && <p id={errorId} role="alert" className="mt-1 text-sm text-rose-600">{error}</p>}
      {field.unique && <p className="mt-1 text-xs text-slate-400">This value must be unique.</p>}
    </div>
  );
}
