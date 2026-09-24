
import { Database, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { cn } from '@/lib/utils';
import { navigationItems } from '@/pages/page-data';
import { useAuth } from '@/context/useAuth';
import { fetchContentTypes } from '@/services/content-type.service';
import type { ContentType } from '@/types/content-type';

const SIDEBAR_GRADIENT =
  'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)';

function SidebarContent() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadContentTypes = () => {
      fetchContentTypes()
        .then((types) => {
          if (!cancelled) setContentTypes(types);
        })
        .catch(() => {
          if (!cancelled) setContentTypes([]);
        });
    };

    loadContentTypes();
    window.addEventListener('content-types-changed', loadContentTypes);
    return () => {
      cancelled = true;
      window.removeEventListener('content-types-changed', loadContentTypes);
    };
  }, []);

  return (
    <>
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-3 px-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}
        >
          C
        </div>

        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            ContentFlow
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-4"
        aria-label="Admin navigation"
      >
        <p
          className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(165,180,252,0.5)' }}
        >
          Manage
        </p>

        <div className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive ? 'text-white' : 'hover:text-white',
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                      background: 'rgba(99,102,241,0.35)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(99,102,241,0.4)',
                    }
                    : undefined
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
                        isActive
                          ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/40'
                          : 'text-indigo-300 group-hover:bg-white/10 group-hover:text-white',
                      )}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </span>

                    <span
                      className={
                        isActive
                          ? 'text-white'
                          : 'text-indigo-200 group-hover:text-white'
                      }
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="mt-6 space-y-0.5">
          <p
            className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(165,180,252,0.5)' }}
          >
            Content Types
          </p>
          {contentTypes.map((type) => (
            <NavLink
              key={type.id}
              to={`/content-manager/${type.id}`}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-indigo-500/25 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <Database className="h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden="true" />
              <span className="truncate">{type.name}</span>
            </NavLink>
          ))}
          {contentTypes.length === 0 && (
            <p className="px-3 py-2 text-xs text-indigo-300/60">No content types yet</p>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Footer content can be added later */}
      </div>
    </>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPage = navigationItems.find(
    (item) => item.path === location.pathname,
  ) ?? (location.pathname.startsWith('/content-manager/')
    ? navigationItems.find((item) => item.path === '/content-manager')
    : undefined);

  // Close sidebar when Escape is pressed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: SIDEBAR_GRADIENT }}
        aria-label="Sidebar"
      >
        {/* Close button — mobile only */}
        <button
          className="absolute right-3 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-indigo-300 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>

        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:ml-64">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 md:px-6"
          style={{
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-indigo-500" />

              <div>
                <p className="text-sm font-semibold leading-tight text-slate-900">
                  {currentPage?.label ?? 'ContentFlow'}
                </p>

                <p className="mt-0.5 text-xs leading-tight text-slate-400">
                  {currentPage?.description ?? 'Administration'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={logout}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />

              <span className="hidden sm:inline">
                Logout
              </span>
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
