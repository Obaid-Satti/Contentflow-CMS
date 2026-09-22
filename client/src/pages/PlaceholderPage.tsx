import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import type { AdminPage } from '@/pages/page-data';

export function PlaceholderPage({ page }: { page: AdminPage }) {
  const Icon = page.icon;
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center">
      <Card className="w-full overflow-hidden border-0 shadow-xl shadow-slate-200/80">
        {/* colour band */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)' }} />

        <CardContent className="p-8 md:p-12">
          {/* icon badge */}
          <div className="mb-8 inline-flex items-center justify-center rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, #eef2ff, #ede9fe)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.15)' }}>
            <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>

          {/* label */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
            Coming soon
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{page.label}</h1>

          <p className="mt-3 max-w-lg text-base leading-7 text-slate-500">
            {page.description}. This page is ready for its feature work in an upcoming milestone.
          </p>

          <div className="mt-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
            <ArrowRight className="h-3.5 w-3.5" />
            Placeholder · feature work pending
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
