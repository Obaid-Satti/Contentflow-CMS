import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileImage, FileText, Image, LoaderCircle, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchMedia, uploadMedia, validateMediaUpload } from '@/services/media.service';
import type { MediaAsset } from '@/services/media.service';

interface MediaPickerModalProps {
  onSelect: (media: MediaAsset) => void;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'The request failed. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

function MediaPreview({ media }: { media: MediaAsset }) {
  if (media.mime.startsWith('image/')) {
    return <img src={media.url} alt={media.alt_text || media.file_name} className="h-full w-full object-cover" />;
  }
  const Icon = media.mime === 'application/pdf' ? FileText : FileImage;
  return <div className="flex h-full items-center justify-center bg-slate-100 text-indigo-500"><Icon className="h-10 w-10" aria-hidden="true" /></div>;
}

export function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const mediaQuery = useQuery({
    queryKey: ['media'],
    queryFn: fetchMedia,
  });
  const uploadMutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: async (media) => {
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      onSelect(media);
    },
    onError: (error) => setUploadError(getErrorMessage(error)),
  });

  const chooseFile = (file?: File) => {
    if (!file) return;
    const validationError = validateMediaUpload(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadError(null);
    uploadMutation.mutate(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploadMutation.isPending) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="media-picker-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="media-picker-title" className="text-lg font-semibold text-slate-900">Choose media</h2>
            <p className="mt-1 text-sm text-slate-500">Select a file from your library or upload a new one.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close media picker" disabled={uploadMutation.isPending} onClick={onClose}><X className="h-4 w-4" /></Button>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 sm:px-6">
          <p className="text-sm text-slate-500">Allowed: JPG, PNG, WebP, GIF, PDF · Maximum 5 MB</p>
          <input ref={inputRef} type="file" className="sr-only" aria-label="Upload media file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf" disabled={uploadMutation.isPending} onChange={(event) => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <Button type="button" size="sm" disabled={uploadMutation.isPending} onClick={() => inputRef.current?.click()}>
            {uploadMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploadMutation.isPending ? 'Uploading…' : 'Upload new'}
          </Button>
        </div>

        {uploadError && <p role="alert" className="mx-5 mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-6">{uploadError}</p>}
        {mediaQuery.isError && <div role="alert" className="mx-5 mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-6">{getErrorMessage(mediaQuery.error)} <button type="button" className="ml-1 font-semibold underline" onClick={() => void mediaQuery.refetch()}>Try again</button></div>}

        <div className="min-h-48 flex-1 overflow-y-auto p-5 sm:p-6">
          {mediaQuery.isPending ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin text-indigo-500" />Loading media…</div>
          ) : mediaQuery.data?.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {mediaQuery.data.map((media) => (
                <button key={media.id} type="button" className="overflow-hidden rounded-lg border border-slate-200 text-left transition hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={() => onSelect(media)}>
                  <div className="aspect-square overflow-hidden bg-slate-100"><MediaPreview media={media} /></div>
                  <span className="block truncate px-2.5 py-2 text-xs font-medium text-slate-700" title={media.file_name}>{media.file_name}</span>
                </button>
              ))}
            </div>
          ) : !mediaQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-slate-500"><Image className="h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-medium">No files in your library yet</p><p className="mt-1 text-xs">Use “Upload new” to add a file.</p></div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
