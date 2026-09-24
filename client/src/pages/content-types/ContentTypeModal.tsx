import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    createContentType,
    updateContentType,
} from '@/services/content-type.service';
import type { ContentType } from '@/types/content-type';
import { generateSlug } from '@/lib/slug';

interface ContentTypeModalProps {
    isOpen: boolean;
    contentType?: ContentType | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ContentTypeModal({
    isOpen,
    contentType,
    onClose,
    onSuccess,
}: ContentTypeModalProps) {
    const isEditMode = Boolean(contentType);

    const [name, setName] = useState('');
    const [apiId, setApiId] = useState('');
    const [apiIdEdited, setApiIdEdited] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (contentType) {
            setName(contentType.name);
            setApiId(contentType.api_id);
            setApiIdEdited(true);
        } else {
            setName('');
            setApiId('');
            setApiIdEdited(false);
        }

        setError(null);
        setIsSaving(false);
    }, [isOpen, contentType]);

    if (!isOpen) {
        return null;
    }

    const handleNameChange = (value: string) => {
        setName(value);

        // Automatically generate API ID only while creating
        // and before the user manually edits it.
        if (!isEditMode && !apiIdEdited) {
            setApiId(generateSlug(value));
        }
    };

    const handleApiIdChange = (value: string) => {
        setApiIdEdited(true);
        setApiId(value);
    };

    const handleSubmit = async () => {
        setError(null);

        if (!name.trim()) {
            setError('Content type name is required.');
            return;
        }

        if (!apiId.trim()) {
            setError('API ID is required.');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(apiId)) {
            setError(
                'API ID can only contain lowercase letters, numbers, and hyphens.',
            );
            return;
        }

        try {
            setIsSaving(true);

            if (contentType) {
                await updateContentType(
                    contentType.id,
                    name.trim(),
                    contentType.api_id,
                    contentType.fields ?? [],
                );
            } else {
                await createContentType(
                    name.trim(),
                    apiId.trim(),
                    [],
                );
            }

            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to save content type:', err);

            if (
                typeof err === 'object' &&
                err !== null &&
                'response' in err
            ) {
                const response = (
                    err as {
                        response?: {
                            status?: number;
                            data?: {
                                message?: string;
                            };
                        };
                    }
                ).response;

                if (response?.status === 409) {
                    setError(
                        'This API ID already exists. Please choose another one.',
                    );
                    return;
                }

                if (response?.data?.message) {
                    setError(response.data.message);
                    return;
                }
            }

            setError('Failed to save content type. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isEditMode
                                ? 'Rename Content Type'
                                : 'Create Content Type'}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {isEditMode
                                ? 'Update the display name of this content type.'
                                : 'Create a new content type for your content.'}
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

                {/* Body */}
                <div className="space-y-5 px-6 py-6">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="content-type-name"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Display Name
                        </label>

                        <input
                            id="content-type-name"
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Blog Post"
                            disabled={isSaving}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* API ID */}
                    <div>
                        <label
                            htmlFor="content-type-api-id"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            API ID
                        </label>

                        <input
                            id="content-type-api-id"
                            type="text"
                            value={apiId}
                            onChange={(e) => handleApiIdChange(e.target.value)}
                            placeholder="e.g. blog-posts"
                            disabled={isSaving || isEditMode}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />

                        <p className="mt-1.5 text-xs text-slate-500">
                            {isEditMode
                                ? 'API ID stays unchanged after the content type is created.'
                                : 'Automatically generated from the display name. You can edit it before saving.'}
                        </p>
                    </div>

                    {/* Preview */}
                    {apiId && (
                        <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs font-medium text-slate-500">
                                API endpoint preview
                            </p>

                            <p className="mt-1 font-mono text-sm text-slate-700">
                                /api/{apiId}
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
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
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? 'Saving...'
                            : isEditMode
                                ? 'Save Changes'
                                : 'Create Content Type'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ContentTypeModal;