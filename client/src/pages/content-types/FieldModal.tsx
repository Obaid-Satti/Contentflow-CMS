import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ContentTypeField, FieldType } from '@/types/content-type';

interface FieldModalProps {
    isOpen: boolean;
    field?: ContentTypeField | null;
    onClose: () => void;
    onSave: (field: ContentTypeField) => Promise<void>;
    onRemove: () => Promise<void>;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'short_text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'enumeration', label: 'Enumeration' },
    { value: 'media', label: 'Media' },
];

export function FieldModal({
    isOpen,
    field,
    onClose,
    onSave,
    onRemove,
}: FieldModalProps) {
    const isEditMode = Boolean(field);

    const [name, setName] = useState('');
    const [type, setType] = useState<FieldType>('short_text');
    const [required, setRequired] = useState(false);
    const [unique, setUnique] = useState(false);
    const [options, setOptions] = useState<string[]>(['']);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setIsSaving(false);

        if (field) {
            setName(field.name);
            setType(field.type);
            setRequired(field.required);
            setUnique(field.unique ?? false);
            setOptions(field.options?.length ? field.options : ['']);
        } else {
            setName('');
            setType('short_text');
            setRequired(false);
            setUnique(false);
            setOptions(['']);
        }
    }, [isOpen, field]);

    if (!isOpen) return null;

    const supportsUnique =
        type === 'short_text' || type === 'email';

    const isEnumeration = type === 'enumeration';

    const handleTypeChange = (value: FieldType) => {
        setType(value);

        if (value !== 'short_text' && value !== 'email') {
            setUnique(false);
        }

        if (value === 'enumeration' && options.length === 0) {
            setOptions(['']);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        setOptions((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index ? value : option,
            ),
        );
    };

    const addOption = () => {
        setOptions((current) => [...current, '']);
    };

    const removeOption = (index: number) => {
        setOptions((current) =>
            current.filter((_, optionIndex) => optionIndex !== index),
        );
    };

    const handleSave = async () => {
        setError(null);
        const cleanName = name.trim();
        if (!cleanName) {
            setError('Field name is required.');
            return;
        }

        const cleanedOptions = options
            .map((option) => option.trim())
            .filter(Boolean);

        if (isEnumeration && cleanedOptions.length === 0) {
            setError('Add at least one option for an enumeration field.');
            return;
        }

        const newField: ContentTypeField = {
            name: cleanName,
            type,
            required,
            ...(supportsUnique ? { unique } : {}),
            ...(isEnumeration ? { options: cleanedOptions } : {}),
        };

        try {
            setIsSaving(true);
            await onSave(newField);
        } catch (err: unknown) {
            const responseMessage = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setError(responseMessage ?? (err instanceof Error ? err.message : 'Failed to save field. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        setError(null);
        try {
            setIsSaving(true);
            await onRemove();
        } catch (err: unknown) {
            const responseMessage = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setError(responseMessage ?? (err instanceof Error ? err.message : 'Failed to remove field. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">

                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isEditMode ? 'Edit Field' : 'Add Field'}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Configure the field for this content type.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-6">

                    {/* Field Name */}
                    <div>
                        <label
                            htmlFor="field-name"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Field Name
                        </label>

                        <input
                            id="field-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                            placeholder="e.g. title"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Field Type */}
                    <div>
                        <label
                            htmlFor="field-type"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Field Type
                        </label>

                            <select
                            id="field-type"
                            value={type}
                                onChange={(e) =>
                                    handleTypeChange(e.target.value as FieldType)
                                }
                                disabled={isSaving}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            {FIELD_TYPES.map((fieldType) => (
                                <option
                                    key={fieldType.value}
                                    value={fieldType.value}
                                >
                                    {fieldType.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Required */}
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={required}
                            onChange={(e) => setRequired(e.target.checked)}
                            disabled={isSaving}
                            className="h-4 w-4"
                        />

                        <span className="text-sm text-slate-700">
                            Required
                        </span>
                    </label>

                    {/* Unique */}
                    {supportsUnique && (
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={unique}
                                onChange={(e) => setUnique(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4"
                            />

                            <span className="text-sm text-slate-700">
                                Unique
                            </span>
                        </label>
                    )}

                    {/* Enumeration Options */}
                    {isEnumeration && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Options
                            </label>

                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) =>
                                                handleOptionChange(index, e.target.value)
                                            }
                                            disabled={isSaving}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                        />

                                        {options.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => removeOption(index)}
                                                disabled={isSaving}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="mt-3"
                                onClick={addOption}
                                disabled={isSaving}
                            >
                                Add Option
                            </Button>
                        </div>
                    )}
                    {error && (
                        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-between gap-3 border-t bg-slate-50 px-6 py-4">
                    {isEditMode && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemove}
                            disabled={isSaving}
                            className="text-rose-600 hover:text-rose-700"
                        >
                            {isSaving ? 'Saving...' : 'Remove Field'}
                        </Button>
                    )}
                    <div className="ml-auto flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Field'}
                    </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default FieldModal;
