import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  stats?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  title,
  description,
  icon: Icon,
  actions,
  stats,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm shadow-slate-100 sm:p-6 backdrop-blur-xs transition-all ${className}`}
    >
      {/* Top accent gradient bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/5 text-indigo-600 shadow-xs sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {badge && (
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100/80 bg-indigo-50/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {badge}
                </span>
                {stats}
              </div>
            )}

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {description}
            </p>
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="relative mt-4 pt-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default PageHeader;
