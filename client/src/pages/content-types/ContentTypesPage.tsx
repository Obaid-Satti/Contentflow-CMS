import { useEffect, useMemo, useState } from 'react';
import {
  Database,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  Code2,
  Sliders,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchContentTypes } from '@/services/content-type.service';
import type { ContentType } from '@/types/content-type';

export function ContentTypesPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isCancelled = false;

    fetchContentTypes()
      .then((data) => {
        if (!isCancelled) {
          setContentTypes(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load content types:', err);
          setError('Unable to load content types. Please check your connection and try again.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const filteredContentTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contentTypes;
    return contentTypes.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        type.api_id.toLowerCase().includes(query),
    );
  }, [contentTypes, searchQuery]);

  const totalFields = useMemo(() => {
    return contentTypes.reduce((acc, curr) => acc + (curr.fields?.length || 0), 0);
  }, [contentTypes]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-indigo-600 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #eef2ff, #ede9fe)',
              boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)',
            }}
          >
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Content-Type Builder
            </h1>
            <p className="text-sm text-slate-500">
              Define your data architecture, manage models and their schema fields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            className="flex items-center gap-2 shadow-sm"
            onClick={() => {
              alert('Create Content Type modal will be implemented in task T-CTB-04.');
            }}
          >
            <Plus className="h-4 w-4" />
            Create new content type
          </Button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Content Types</p>
              <p className="text-2xl font-bold text-slate-900">{contentTypes.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Fields</p>
              <p className="text-2xl font-bold text-slate-900">{totalFields}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">API Schema</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                JSONB Synced
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or API ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {searchQuery && (
          <p className="text-xs text-slate-500">
            Found <span className="font-semibold text-slate-700">{filteredContentTypes.length}</span> of {contentTypes.length} content types
          </p>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        /* Loading skeleton */
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-200 bg-white p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-28 rounded bg-slate-200" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <Card className="border-rose-200 bg-rose-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900">Failed to load content types</h3>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refetch}
                  className="border-rose-300 text-rose-800 hover:bg-rose-100"
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : contentTypes.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-2 border-slate-300 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-indigo-600"
              style={{
                background: 'linear-gradient(135deg, #eef2ff, #ede9fe)',
              }}
            >
              <Database className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No content types yet</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Content types define the schema and fields for your content models (like Articles, Products, Authors).
            </p>
            <div className="mt-6">
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  alert('Create Content Type modal will be implemented in task T-CTB-04.');
                }}
              >
                <Plus className="h-4 w-4" />
                Create your first content type
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredContentTypes.length === 0 ? (
        /* No search results */
        <Card className="border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No content types matching &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="mt-3"
          >
            Clear search
          </Button>
        </Card>
      ) : (
        /* Content Types List Table / Cards */
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-4">Type Name</th>
                  <th className="px-4 py-3.5">API ID / Endpoint</th>
                  <th className="px-4 py-3.5">Fields</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5">Updated</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContentTypes.map((type) => {
                  const fieldsList = type.fields || [];

                  return (
                    <tr
                      key={type.id}
                      className="group transition-colors hover:bg-indigo-50/30"
                    >
                      {/* Name */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-semibold group-hover:bg-indigo-100 transition-colors">
                            {type.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                              {type.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              ID: #{type.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* API ID */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                          <span>/api/{type.api_id}</span>
                        </div>
                      </td>

                      {/* Fields */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {fieldsList.length} {fieldsList.length === 1 ? 'field' : 'fields'}
                            </span>
                          </div>
                          {fieldsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {fieldsList.slice(0, 3).map((f) => (
                                <span
                                  key={f.name}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                                  title={`${f.name} (${f.type})`}
                                >
                                  {f.name}
                                </span>
                              ))}
                              {fieldsList.length > 3 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{fieldsList.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(type.created_at)}
                        </div>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(type.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Configure Fields (T-CTB-05)"
                            className="h-8 px-2.5 text-slate-600 hover:text-indigo-600"
                            onClick={() => {
                              alert(`Configure fields for "${type.name}" will be implemented in task T-CTB-05.`);
                            }}
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" />
                            Fields
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Type (T-CTB-06)"
                            className="h-8 px-2 text-slate-400 hover:text-rose-600"
                            onClick={() => {
                              alert(`Delete confirmation for "${type.name}" will be implemented in task T-CTB-06.`);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredContentTypes.length} of {contentTypes.length} content types</span>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Schema updates drive forms and API</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ContentTypesPage;
