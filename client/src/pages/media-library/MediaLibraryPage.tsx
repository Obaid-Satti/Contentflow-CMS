import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CircleAlert,
  CircleCheck,
  FileImage,
  FileText,
  Image,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  deleteMedia,
  fetchMedia,
  updateMediaAltText,
  uploadMedia,
  validateMediaUpload,
} from '@/services/media.service';
import type { MediaAsset } from '@/services/media.service';

const ALLOWED_TYPES_MESSAGE = 'JPG, PNG, WebP, GIF, and PDF';

type ToastMessage = { type: 'success' | 'error'; message: string };

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'The request failed. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

function formatFileSize(value: number | string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function MediaPreview({ media }: { media: MediaAsset }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const isImage = media.mime.startsWith('image/');
  const imageFailed = failedImageUrl === media.url;

  if (isImage && !imageFailed) {
    return (
      <img
        src={media.url}
        alt={media.alt_text || media.file_name}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailedImageUrl(media.url)}
      />
    );
  }

  const Icon = media.mime === 'application/pdf' ? FileText : FileImage;
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-indigo-500">
      <Icon className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only">{media.mime === 'application/pdf' ? 'PDF document' : 'File'}</span>
    </div>
  );
}

function MediaToast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const isSuccess = toast.type === 'success';

  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={`fixed right-4 top-4 z-[60] flex max-w-md items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg ${isSuccess ? 'border-emerald-200 text-emerald-800' : 'border-rose-200 text-rose-800'}`}
    >
      {isSuccess
        ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function DeleteMediaDialog({
  media,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  media: MediaAsset;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-media-title" className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-media-title" className="text-lg font-semibold text-slate-900">Delete this file?</h2>
              <p className="mt-1 break-all text-sm font-medium text-slate-700">{media.file_name}</p>
              <p className="mt-2 text-sm text-slate-500">This permanently removes the file. Any entry using it will have that media field cleared.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>Cancel</Button>
          <Button type="button" disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700" onClick={onConfirm}>
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isDeleting ? 'Deleting…' : 'Delete file'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UploadBatchResult {
  uploaded: number;
  errors: string[];
}

export function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaToDelete, setMediaToDelete] = useState<MediaAsset | null>(null);
  const [mediaToEditAltText, setMediaToEditAltText] = useState<MediaAsset | null>(null);
  const [altTextDraft, setAltTextDraft] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mediaQuery = useQuery({
    queryKey: ['media'],
    queryFn: fetchMedia,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]): Promise<UploadBatchResult> => {
      let uploaded = 0;
      const errors: string[] = [];

      for (const file of files) {
        const validationMessage = validateMediaUpload(file);
        if (validationMessage) {
          errors.push(validationMessage);
          continue;
        }

        try {
          await uploadMedia(file);
          uploaded += 1;
        } catch (error) {
          errors.push(`${file.name}: ${getErrorMessage(error)}`);
        }
      }

      return { uploaded, errors };
    },
    onSuccess: async ({ uploaded, errors }) => {
      if (uploaded > 0) await queryClient.invalidateQueries({ queryKey: ['media'] });

      if (errors.length > 0) {
        const summary = uploaded > 0 ? `Uploaded ${uploaded} file(s). ` : '';
        setToast({ type: 'error', message: `${summary}${errors.join(' ')}` });
      } else if (uploaded > 0) {
        setToast({
          type: 'success',
          message: `Uploaded ${uploaded} ${uploaded === 1 ? 'file' : 'files'} successfully.`,
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['media'] }),
        queryClient.invalidateQueries({ queryKey: ['entries'] }),
      ]);
      setMediaToDelete(null);
      setToast({ type: 'success', message: 'Media file deleted successfully.' });
    },
    onError: (error) => setToast({ type: 'error', message: getErrorMessage(error) }),
  });

  const altTextMutation = useMutation({
    mutationFn: ({ id, altText }: { id: number; altText: string }) =>
      updateMediaAltText(id, altText),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      setMediaToEditAltText(null);
      setToast({ type: 'success', message: 'Image alt text updated.' });
    },
    onError: (error) => setToast({ type: 'error', message: getErrorMessage(error) }),
  });

  const handleFiles = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length > 0) uploadMutation.mutate(selectedFiles);
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {toast && <MediaToast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Assets</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Media Library</h1>
          <p className="mt-1 text-sm text-slate-500">Upload and manage images and documents used in your content.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Image className="h-4 w-4 text-indigo-500" aria-hidden="true" />
          <span>{mediaQuery.data?.length ?? 0} {mediaQuery.data?.length === 1 ? 'file' : 'files'}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={mediaQuery.isFetching}
            onClick={() => void mediaQuery.refetch()}
            aria-label="Refresh media files"
          >
            <RefreshCw className={`h-4 w-4 ${mediaQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Card
        className={`border-2 border-dashed bg-white p-6 transition-colors sm:p-8 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}`}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="sr-only"
          aria-label="Choose media files to upload"
          disabled={uploadMutation.isPending}
          onChange={(event) => {
            handleFiles(event.target.files ?? []);
            event.currentTarget.value = '';
          }}
        />
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            {uploadMutation.isPending
              ? <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
              : <Upload className="h-6 w-6" aria-hidden="true" />}
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            {uploadMutation.isPending ? 'Uploading your files…' : 'Drop files here to upload'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">or select files from your computer</p>
          <Button
            type="button"
            className="mt-4"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />Browse files
          </Button>
          <p className="mt-4 text-xs text-slate-400">Allowed: {ALLOWED_TYPES_MESSAGE} · Maximum 5 MB per file</p>
        </div>
      </Card>

      {mediaQuery.isError && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{getErrorMessage(mediaQuery.error)}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void mediaQuery.refetch()}>Try again</Button>
        </div>
      )}

      {mediaQuery.isPending ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-indigo-500" aria-hidden="true" />Loading media files…
        </div>
      ) : mediaQuery.data?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {mediaQuery.data.map((media) => (
            <Card key={media.id} className="group overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <MediaPreview media={media} />
              </div>
              {media.mime.startsWith('image/') && (
                <div className="border-b border-slate-100 px-4 py-3">
                  {mediaToEditAltText?.id === media.id ? (
                    <form
                      className="space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        altTextMutation.mutate({ id: media.id, altText: altTextDraft });
                      }}
                    >
                      <label htmlFor={`alt-text-${media.id}`} className="block text-xs font-medium text-slate-600">Image alt text</label>
                      <input
                        id={`alt-text-${media.id}`}
                        type="text"
                        maxLength={1000}
                        value={altTextDraft}
                        onChange={(event) => setAltTextDraft(event.target.value)}
                        placeholder="Describe this image"
                        className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        disabled={altTextMutation.isPending}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={altTextMutation.isPending}
                          onClick={() => setMediaToEditAltText(null)}
                        >Cancel</Button>
                        <Button type="submit" size="sm" disabled={altTextMutation.isPending}>
                          {altTextMutation.isPending ? 'Saving…' : 'Save alt text'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Alt text: </span>
                        <span className="break-words">{media.alt_text || 'Not set'}</span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setMediaToEditAltText(media);
                          setAltTextDraft(media.alt_text);
                        }}
                        aria-label={`Edit alt text for ${media.file_name}`}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Edit
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-semibold text-slate-900" title={media.file_name}>{media.file_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(media.size_bytes)} <span aria-hidden="true">·</span> {formatUploadDate(media.created_at)}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <a href={media.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                    Open file<span className="sr-only"> {media.file_name}</span>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setMediaToDelete(media)}
                    aria-label={`Delete ${media.file_name}`}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !mediaQuery.isError ? (
        <Card className="flex min-h-64 flex-col items-center justify-center border-slate-200 bg-white px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Image className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">Your library is empty</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Upload an image or PDF and it will appear here for your content.</p>
        </Card>
      ) : null}

      {mediaToDelete && (
        <DeleteMediaDialog
          media={mediaToDelete}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setMediaToDelete(null)}
          onConfirm={() => deleteMutation.mutate(mediaToDelete.id)}
        />
      )}
    </section>
  );
}
