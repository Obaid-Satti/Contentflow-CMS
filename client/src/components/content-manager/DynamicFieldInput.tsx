import type { ChangeEvent, ReactNode } from 'react';
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
): ReactNode {
  const id = `entry-${field.name}`;
  const required = field.required;

  switch (field.type) {
    case 'long_text':
      return (
        <textarea
          id={id}
          className={inputClass}
          rows={5}
          value={String(value)}
          required={required}
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
            onChange={(event) => onChange(event.target.checked)}
          />
          {value ? 'Yes' : 'No'}
        </label>
      );
    case 'enumeration':
      return (
        <select
          id={id}
          className={inputClass}
          value={String(value)}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose an option</option>
          {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    case 'media':
      return (
        <input
          id={id}
          className={inputClass}
          type="file"
          required={required && !value}
          onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')}
        />
      );
    case 'short_text':
    case 'number':
    case 'date':
    case 'email': {
      const inputType = getTextInputType(field.type);
      return (
        <input
          id={id}
          className={inputClass}
          type={inputType}
          step={inputType === 'number' ? 'any' : undefined}
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

export function DynamicFieldInput({ field, value, error, onChange }: DynamicFieldInputProps) {
  const id = `entry-${field.name}`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {field.name}{field.required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {renderFieldInput(field, value, onChange)}
      {error && <p id={errorId} role="alert" className="mt-1 text-sm text-rose-600">{error}</p>}
      {field.type === 'media' && (
        <p className="mt-1 text-xs text-slate-400">
          {typeof value === 'string' && value ? `Selected file: ${value}. ` : ''}
          File selection is shown here; upload and storage belong to the Media Library task.
        </p>
      )}
      {field.unique && <p className="mt-1 text-xs text-slate-400">This value must be unique.</p>}
    </div>
  );
}
