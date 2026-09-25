import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DynamicFieldInput } from '@/components/content-manager/DynamicFieldInput';
import {
  createEntry,
  deleteEntry,
  fetchContentTypes,
  fetchEntries,
  fetchEntry,
  updateEntry,
} from '@/services/content-type.service';
import type { ContentEntry, EntryListResponse } from '@/types/content-entry';
import type { ContentTypeField } from '@/types/content-type';

type EntryFormValue = string | boolean;

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return 'Something went wrong. Please try again.';
}

function getServerValidationFeedback(
  error: unknown,
  validFieldNames: Set<string>,
): { fieldErrors: Record<string, string>; formError: string | null } {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return { fieldErrors: {}, formError: getErrorMessage(error) };
  }
  const response = (error as {
    response?: { data?: { message?: string; errors?: Array<{ field?: string; message?: string }> } };
  }).response;
  const fieldErrors: Record<string, string> = {};
  const formMessages: string[] = [];
  for (const issue of response?.data?.errors ?? []) {
    const message = issue.message ?? 'Invalid value.';
    if (issue.field && issue.field !== '_form' && validFieldNames.has(issue.field)) {
      fieldErrors[issue.field] = message;
    } else {
      formMessages.push(message);
    }
  }
  const formError = formMessages.length > 0
    ? formMessages.join(' ')
    : Object.keys(fieldErrors).length > 0
      ? null
      : response?.data?.message ?? getErrorMessage(error);
  return { fieldErrors, formError };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toFormValue(field: ContentTypeField, value: unknown): EntryFormValue {
  if (field.type === 'boolean') return typeof value === 'boolean' ? value : false;
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value : String(value);
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface DeleteEntryDialogProps {
  entry: ContentEntry;
  contentTypeName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteEntryDialog({
  entry,
  contentTypeName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteEntryDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-entry-title" className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b px-6 py-5">
          <h2 id="delete-entry-title" className="text-lg font-semibold text-slate-900">Delete this entry?</h2>
          <p className="mt-2 text-sm text-slate-600">This permanently removes entry #{entry.id} from {contentTypeName}.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>Cancel</Button>
          <Button type="button" disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700" onClick={onConfirm}>{isDeleting ? 'Deleting…' : 'Delete Entry'}</Button>
        </div>
      </div>
    </div>
  );
}

type ToastMessage = { type: 'success' | 'error'; message: string };

function DeleteToast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const isSuccess = toast.type === 'success';
  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={`fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${isSuccess ? 'border-emerald-200 bg-white text-emerald-800' : 'border-rose-200 bg-white text-rose-800'}`}
    >
      {isSuccess ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ContentManagerPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { contentTypeId: routeTypeId, entryId } = useParams();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25>(10);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [formValues, setFormValues] = useState<Record<string, EntryFormValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState<ToastMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ContentEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeFromRoute = Number(routeTypeId);
  const typeFromQuery = Number(searchParams.get('type'));
  const routeMode = location.pathname.endsWith('/entries/new')
    ? 'create'
    : entryId ? 'edit' : 'list';
  const contentTypesQuery = useQuery({
    queryKey: ['content-types'],
    queryFn: fetchContentTypes,
  });
  const contentTypes = contentTypesQuery.data ?? [];
  const requestedTypeId = Number.isInteger(typeFromRoute) && typeFromRoute > 0
    ? typeFromRoute
    : typeFromQuery;
  const selectedTypeId = contentTypes.find((type) => type.id === requestedTypeId)?.id
    ?? contentTypes[0]?.id ?? null;
  const selectedType = contentTypes.find((type) => type.id === selectedTypeId) ?? null;
  const entriesQuery = useQuery({
    queryKey: ['entries', selectedTypeId, page, pageSize, sortBy, sortOrder, debouncedSearch],
    queryFn: () => fetchEntries(selectedTypeId!, {
      page, pageSize, sortBy, sortOrder,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    enabled: Boolean(selectedTypeId) && routeMode === 'list',
  });

  useEffect(() => {
    const refreshTypes = () => void queryClient.invalidateQueries({ queryKey: ['content-types'] });
    window.addEventListener('content-types-changed', refreshTypes);
    return () => window.removeEventListener('content-types-changed', refreshTypes);
  }, [queryClient]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const navigationState = location.state as { contentManagerToast?: ToastMessage } | null;
    const toast = navigationState?.contentManagerToast;
    if (!toast || (toast.type !== 'success' && toast.type !== 'error')) return;

    const timer = window.setTimeout(() => setDeleteToast(toast), 0);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!deleteToast) return;
    const timer = window.setTimeout(() => {
      setDeleteToast(null);
      const navigationState = location.state as { contentManagerToast?: ToastMessage } | null;
      if (navigationState?.contentManagerToast) {
        navigate(`${location.pathname}${location.search}${location.hash}`, {
          replace: true,
          state: null,
        });
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [deleteToast, location.hash, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!selectedType || routeMode === 'list') return;
    let cancelled = false;

    const loadEditor = async () => {
      setEntry(null);
      setFormError(null);
      setFieldErrors({});

      if (routeMode === 'create') {
        setFormValues(Object.fromEntries(
          selectedType.fields.map((field) => [field.name, toFormValue(field, undefined)]),
        ));
        return;
      }

      const numericEntryId = Number(entryId);
      if (!Number.isSafeInteger(numericEntryId) || numericEntryId <= 0) {
        setFormError('Invalid entry ID.');
        return;
      }
      try {
        const loadedEntry = await fetchEntry(selectedType.id, numericEntryId);
        if (cancelled) return;
        setEntry(loadedEntry);
        setFormValues(Object.fromEntries(
          selectedType.fields.map((field) => [field.name, toFormValue(field, loadedEntry.data[field.name])]),
        ));
      } catch (loadError: unknown) {
        if (!cancelled) setFormError(getErrorMessage(loadError));
      }
    };
    void loadEditor();
    return () => { cancelled = true; };
  }, [selectedType, routeMode, entryId]);

  const displayFields = useMemo(
    () => selectedType?.fields.slice(0, 4) ?? [],
    [selectedType],
  );

  const backToList = () => {
    if (selectedTypeId) navigate(`/content-manager/${selectedTypeId}`);
    else navigate('/content-manager');
  };

  const toggleSort = (fieldName: string) => {
    if (sortBy === fieldName) setSortOrder((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(fieldName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const validateForm = (): Record<string, string> => {
    if (!selectedType) return {};
    const nextErrors: Record<string, string> = {};
    for (const field of selectedType.fields) {
      const value = formValues[field.name];
      const empty = value === undefined || value === '' ||
        (typeof value === 'string' && value.trim() === '');
      if (field.required && empty) {
        nextErrors[field.name] = 'This field is required.';
        continue;
      }
      if (empty) continue;
      if (field.type === 'number' && (typeof value !== 'string' || !Number.isFinite(Number(value)))) {
        nextErrors[field.name] = 'Enter a valid number.';
      } else if (field.type === 'email' && (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
        nextErrors[field.name] = 'Enter a valid email address.';
      } else if (field.type === 'enumeration' && !field.options?.includes(String(value))) {
        nextErrors[field.name] = 'Choose one of the available options.';
      } else if (field.type === 'date' && (typeof value !== 'string' || !isValidDate(value))) {
        nextErrors[field.name] = 'Enter a valid date.';
      }
    }
    return nextErrors;
  };

  const saveEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedType) return;
    setFormError(null);
    const clientErrors = validateForm();
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      const firstInvalidField = Object.keys(clientErrors)[0];
      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          document.getElementById(`entry-${firstInvalidField}`)?.focus();
        });
      }
      return;
    }

    const data: Record<string, unknown> = {};
    for (const field of selectedType.fields) {
      const value = formValues[field.name];
      if (value === '' || value === undefined) continue;
      data[field.name] = field.type === 'number' ? Number(value) : value;
    }

    setIsSaving(true);
    try {
      if (routeMode === 'create') {
        await createEntry(selectedType.id, data);
      } else if (entry) {
        await updateEntry(selectedType.id, entry.id, data);
      }
      await queryClient.invalidateQueries({ queryKey: ['entries', selectedType.id] });
      backToList();
    } catch (saveError: unknown) {
      const feedback = getServerValidationFeedback(
        saveError,
        new Set(selectedType.fields.map((field) => field.name)),
      );
      setFormError(feedback.formError);
      setFieldErrors(feedback.fieldErrors);
      const firstInvalidField = Object.keys(feedback.fieldErrors)[0];
      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          document.getElementById(`entry-${firstInvalidField}`)?.focus();
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedType || !entryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEntry(selectedType.id, entryToDelete.id);
      const currentListKey = [
        'entries', selectedType.id, page, pageSize, sortBy, sortOrder, debouncedSearch,
      ] as const;
      const deletingLastRowOnPage = routeMode === 'list' && page > 1 &&
        queryClient.getQueryData<EntryListResponse>(currentListKey)?.entries.length === 1;
      queryClient.setQueriesData<EntryListResponse>(
        { queryKey: ['entries', selectedType.id] },
        (current) => {
          if (!current) return current;
          const entries = current.entries.filter((item) => item.id !== entryToDelete.id);
          if (entries.length === current.entries.length) return current;
          const total = Math.max(0, current.pagination.total - 1);
          return {
            entries,
            pagination: {
              ...current.pagination,
              total,
              totalPages: Math.ceil(total / current.pagination.pageSize),
            },
          };
        },
      );
      if (deletingLastRowOnPage) setPage((current) => Math.max(1, current - 1));
      await queryClient.invalidateQueries({ queryKey: ['entries', selectedType.id] });
      const successToast: ToastMessage = {
        type: 'success',
        message: `Entry #${entryToDelete.id} was deleted.`,
      };
      setEntryToDelete(null);
      navigate(`/content-manager/${selectedType.id}`, {
        state: { contentManagerToast: successToast },
      });
    } catch (deleteFailure: unknown) {
      setDeleteToast({ type: 'error', message: getErrorMessage(deleteFailure) });
    } finally {
      setIsDeleting(false);
    }
  };

  if (contentTypesQuery.isPending) {
    return <Card><CardContent className="p-8 text-sm text-slate-500">Loading content types…</CardContent></Card>;
  }

  if (contentTypesQuery.isError && contentTypes.length === 0) {
    return <Card><CardContent className="p-8 text-sm text-rose-700">{getErrorMessage(contentTypesQuery.error)}</CardContent></Card>;
  }

  if (contentTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-8">
          <h1 className="text-xl font-semibold text-slate-900">No content types yet</h1>
          <p className="text-sm text-slate-500">Create a content type first. Its fields will define the entry form.</p>
          <Link to="/content-types" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Open Content-Type Builder</Link>
        </CardContent>
      </Card>
    );
  }

  if (contentTypesQuery.isError || !selectedType) {
    return <Card><CardContent className="p-8 text-sm text-rose-700">The requested content type could not be found.</CardContent></Card>;
  }

  if (routeMode !== 'list') {
    if (selectedType.fields.length === 0) {
      return (
        <section className="mx-auto max-w-3xl space-y-5">
          <div>
            <button type="button" onClick={backToList} className="mb-2 text-sm text-indigo-600 hover:text-indigo-700">← Back to {selectedType.name}</button>
            <h1 className="text-2xl font-bold text-slate-900">{routeMode === 'create' ? `New ${selectedType.name}` : `Edit ${selectedType.name}`}</h1>
          </div>
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="font-medium text-slate-900">This content type has no fields yet.</p>
              <p className="text-sm text-slate-500">Add fields in the Content-Type Builder first. They will then appear here automatically.</p>
              <Link to="/content-types" className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">Open Content-Type Builder</Link>
            </CardContent>
          </Card>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-3xl space-y-5">
        {deleteToast && <DeleteToast toast={deleteToast} onClose={() => setDeleteToast(null)} />}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button type="button" onClick={backToList} className="mb-2 text-sm text-indigo-600 hover:text-indigo-700">← Back to {selectedType.name}</button>
            <h1 className="text-2xl font-bold text-slate-900">{routeMode === 'create' ? `New ${selectedType.name}` : `Edit ${selectedType.name}`}</h1>
            <p className="mt-1 text-sm text-slate-500">Fields are generated from this content type’s definition.</p>
          </div>
        </div>

        {entry && (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
            <p><span className="text-slate-500">Created:</span> <span className="font-medium text-slate-700">{new Date(entry.created_at).toLocaleString()}</span></p>
            <p><span className="text-slate-500">Updated:</span> <span className="font-medium text-slate-700">{new Date(entry.updated_at).toLocaleString()}</span></p>
          </div>
        )}

        <form noValidate onSubmit={saveEntry} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedType.fields.map((field) => {
            const value = formValues[field.name] ?? (field.type === 'boolean' ? false : '');
            return (
              <DynamicFieldInput
                key={field.name}
                field={field}
                value={value}
                error={fieldErrors[field.name]}
                onChange={(nextValue) => {
                  setFormValues((current) => ({ ...current, [field.name]: nextValue }));
                  setFieldErrors((current) => {
                    if (!(field.name in current)) return current;
                    const next = { ...current };
                    delete next[field.name];
                    return next;
                  });
                  setFormError(null);
                }}
              />
            );
          })}

          {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>}

          <div className="flex justify-end gap-3 border-t pt-5">
            {routeMode === 'edit' && entry && <Button type="button" variant="outline" className="mr-auto text-rose-600" onClick={() => setEntryToDelete(entry)}><Trash2 className="mr-2 h-4 w-4" />Delete Entry</Button>}
            <Button type="button" variant="outline" disabled={isSaving} onClick={backToList}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : routeMode === 'create' ? 'Create Entry' : 'Save Changes'}</Button>
          </div>
        </form>

        {entryToDelete && (
          <DeleteEntryDialog
            entry={entryToDelete}
            contentTypeName={selectedType.name}
            isDeleting={isDeleting}
            onCancel={() => setEntryToDelete(null)}
            onConfirm={() => void confirmDelete()}
          />
        )}
      </section>
    );
  }

  return (
      <section className="space-y-6">
      {deleteToast && <DeleteToast toast={deleteToast} onClose={() => setDeleteToast(null)} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Content Manager</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{selectedType.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage entries defined by this content type.</p>
        </div>
        <Button type="button" onClick={() => navigate(`/content-manager/${selectedType.id}/entries/new`)}><Plus className="mr-2 h-4 w-4" />Create Entry</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative max-w-lg flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" placeholder="Search text fields…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page</span>
          <select className="rounded-lg border border-slate-200 bg-white px-2.5 py-2" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value) as 10 | 25); setPage(1); }}>
            <option value={10}>10</option><option value={25}>25</option>
          </select>
          <Button type="button" size="sm" variant="outline" disabled={entriesQuery.isFetching} onClick={() => void queryClient.invalidateQueries({ queryKey: ['entries', selectedType.id] })} aria-label="Refresh entries"><RefreshCw className={`h-4 w-4 ${entriesQuery.isFetching ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>

      {entriesQuery.isError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getErrorMessage(entriesQuery.error)}</div>}

      <Card className="overflow-hidden border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {displayFields.map((field) => (
                  <th key={field.name} className="px-4 py-3 font-semibold">
                    <button type="button" className="inline-flex items-center gap-1.5 hover:text-slate-900" onClick={() => toggleSort(field.name)}>
                      {field.name}{sortBy === field.name ? sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold">
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-slate-900" onClick={() => toggleSort('updated_at')}>
                    Updated{sortBy === 'updated_at' ? sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entriesQuery.isPending ? (
                <tr><td colSpan={displayFields.length + 2} className="px-4 py-12 text-center text-slate-500">Loading entries…</td></tr>
              ) : (entriesQuery.data?.entries.length ?? 0) === 0 ? (
                <tr><td colSpan={displayFields.length + 2} className="px-4 py-12 text-center text-slate-500">{debouncedSearch ? 'No matching entries.' : 'No entries yet. Create the first one.'}</td></tr>
              ) : entriesQuery.data?.entries.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30">
                  {displayFields.map((field) => (
                    <td key={field.name} className="max-w-xs truncate px-4 py-3.5 text-slate-700" title={displayValue(item.data[field.name])}>{displayValue(item.data[field.name])}</td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    <button type="button" className="hover:text-indigo-600" onClick={() => navigate(`/content-manager/${selectedType.id}/entries/${item.id}`)}>{new Date(item.updated_at).toLocaleString()}</button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => navigate(`/content-manager/${selectedType.id}/entries/${item.id}`)} aria-label={`Edit entry ${item.id}`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setEntryToDelete(item)} aria-label={`Delete entry ${item.id}`}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
                      </Button>
                    </div>
                  </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardContent className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>{(entriesQuery.data?.pagination.total ?? 0) === 0 ? '0 entries' : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, entriesQuery.data?.pagination.total ?? 0)} of ${entriesQuery.data?.pagination.total ?? 0}`}</span>
          <div className="flex items-center gap-2">
            <span>Page {entriesQuery.data?.pagination.totalPages ? page : 0} of {entriesQuery.data?.pagination.totalPages ?? 0}</span>
            <Button type="button" size="sm" variant="outline" disabled={page <= 1 || entriesQuery.isFetching} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button type="button" size="sm" variant="outline" disabled={page >= (entriesQuery.data?.pagination.totalPages ?? 0) || entriesQuery.isFetching} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {entryToDelete && (
        <DeleteEntryDialog
          entry={entryToDelete}
          contentTypeName={selectedType.name}
          isDeleting={isDeleting}
          onCancel={() => setEntryToDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      <p className="text-xs text-slate-400">Showing up to four fields from the content type definition. Search checks text fields.</p>
    </section>
  );
}

export default ContentManagerPage;
