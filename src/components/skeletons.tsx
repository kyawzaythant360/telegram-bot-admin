import type { ReactNode } from "react";

/** Loading placeholders shaped like the pages they stand in for. */

function Block({ className }: { className: string }) {
  return <div className={`rounded-xl bg-subtle ${className}`} />;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true" className="animate-pulse">
      <span className="sr-only" role="status">
        Loading
      </span>
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Shell>
      <Block className="mb-6 h-8 w-48 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Block className="h-36 sm:col-span-2" />
        <Block className="h-36" />
        <Block className="h-36" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Block className="h-80 lg:col-span-2" />
        <Block className="h-80" />
      </div>
    </Shell>
  );
}

export function ListSkeleton({ filters = false }: { filters?: boolean }) {
  return (
    <Shell>
      <Block className="mb-6 h-8 w-40 rounded-lg" />
      {filters && <Block className="mb-4 h-9 w-full max-w-xl rounded-full" />}
      <Block className="mb-4 h-11 w-full rounded-lg" />
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
            <div className="h-4 flex-1 rounded bg-subtle" />
            <div className="h-4 w-20 rounded bg-subtle" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function DetailSkeleton() {
  return (
    <Shell>
      <Block className="mb-2 h-4 w-20 rounded" />
      <Block className="mb-6 h-8 w-64 rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Block className="h-40" />
          <Block className="h-48" />
        </div>
        <Block className="h-72 lg:col-span-2" />
      </div>
    </Shell>
  );
}
