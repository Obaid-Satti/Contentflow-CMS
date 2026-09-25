import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CircleAlert, CircleCheck, Copy, KeyRound, LoaderCircle, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createApiToken,
  deleteApiToken,
  fetchApiTokens,
  type ApiTokenSummary,
} from '@/services/api-token.service';

type ToastMessage = { type: 'success' | 'error'; message: string };

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'The request failed. Please try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function formatDate(value: string | null): string {
  if (!value) return 'Never used';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function SettingsToast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
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
      {isSuccess ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateTokenDialog({
  isCreating,
  onClose,
  onCreate,
}: {
  isCreating: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Token name is required.');
      return;
    }
    onCreate(trimmedName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} aria-modal="true" role="dialog" aria-labelledby="create-token-title" className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="create-token-title" className="text-lg font-semibold text-slate-900">Create API token</h2>
            <p className="mt-1 text-sm text-slate-500">Name this token so you know which website or app uses it.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isCreating} aria-label="Close dialog" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">
          <label htmlFor="api-token-name" className="mb-1.5 block text-sm font-medium text-slate-700">Token name</label>
          <input
            id="api-token-name"
            autoFocus
            value={name}
            disabled={isCreating}
            onChange={(event) => { setName(event.target.value); setError(null); }}
            placeholder="e.g. Website Frontend"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" disabled={isCreating} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating…' : 'Create token'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ShowTokenDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="show-token-title" className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"><KeyRound className="h-5 w-5" /></div>
            <div>
              <h2 id="show-token-title" className="text-lg font-semibold text-slate-900">Copy your API token</h2>
              <p className="mt-1 text-sm text-slate-600">Copy it now. For security, you will not be able to view it again.</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <code className="block break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">{token}</code>
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => void copyToken()}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? 'Copied' : 'Copy token'}
          </Button>
          {!copied && <p className="mt-3 text-xs text-slate-500">If copy does not work, select and copy the token above before closing this dialog.</p>}
        </div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" onClick={onClose}>I have copied it</Button>
        </div>
      </div>
    </div>
  );
}

function DeleteTokenDialog({
  token,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  token: ApiTokenSummary;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-token-title" className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 id="delete-token-title" className="text-lg font-semibold text-slate-900">Delete API token?</h2>
          <p className="mt-2 text-sm text-slate-600">Deleting <span className="font-medium text-slate-800">{token.name}</span> immediately removes access for any website or app using it.</p>
        </div>
        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>Cancel</Button>
          <Button type="button" disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700" onClick={onConfirm}>
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting…' : 'Delete token'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<ApiTokenSummary | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const tokensQuery = useQuery({ queryKey: ['api-tokens'], queryFn: fetchApiTokens });
  const createMutation = useMutation({
    mutationFn: createApiToken,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setIsCreateOpen(false);
      setNewToken(created.token);
    },
    onError: (error) => setToast({ type: 'error', message: getErrorMessage(error) }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteApiToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setTokenToDelete(null);
      setToast({ type: 'success', message: 'API token deleted successfully.' });
    },
    onError: (error) => setToast({ type: 'error', message: getErrorMessage(error) }),
  });

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      {toast && <SettingsToast toast={toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Access</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">API Tokens</h1>
          <p className="mt-1 text-sm text-slate-500">Create tokens for websites and apps that need read-only access to your content.</p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create token</Button>
      </div>

      <Card className="overflow-hidden bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-slate-900">Your API tokens</h2>
          <p className="mt-1 text-sm text-slate-500">Token values are shown only once when created.</p>
        </div>
        {tokensQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading tokens…</div>
        ) : tokensQuery.isError ? (
          <div className="px-6 py-10 text-sm text-rose-600">Could not load API tokens. Please refresh the page.</div>
        ) : tokensQuery.data?.length === 0 ? (
          <div className="px-6 py-12 text-center"><KeyRound className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-medium text-slate-700">No API tokens yet</p><p className="mt-1 text-sm text-slate-500">Create a token before connecting a website or app.</p></div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {tokensQuery.data?.map((token) => (
              <li key={token.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0"><p className="font-medium text-slate-900">{token.name}</p><p className="mt-1 text-sm text-slate-500">Created {formatDate(token.created_at)} · Last used {formatDate(token.last_used_at)}</p></div>
                <Button type="button" variant="outline" size="sm" className="self-start border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 sm:self-auto" onClick={() => setTokenToDelete(token)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isCreateOpen && <CreateTokenDialog isCreating={createMutation.isPending} onClose={() => setIsCreateOpen(false)} onCreate={(name) => createMutation.mutate(name)} />}
      {newToken && <ShowTokenDialog token={newToken} onClose={() => setNewToken(null)} />}
      {tokenToDelete && <DeleteTokenDialog token={tokenToDelete} isDeleting={deleteMutation.isPending} onCancel={() => setTokenToDelete(null)} onConfirm={() => deleteMutation.mutate(tokenToDelete.id)} />}
    </section>
  );
}
