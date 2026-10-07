"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { buttonClass } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-surface px-5 py-10 text-center">
      <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
        <TriangleAlert aria-hidden className="size-5" />
      </span>
      <h1 className="font-semibold text-ink">This page could not load</h1>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
        Usually the database is waking up or DATABASE_URL is wrong. Try again in a few seconds.
        {error.digest && <span className="mt-2 block font-mono text-xs text-ink-3">Error {error.digest}</span>}
      </p>
      <button type="button" onClick={reset} className={buttonClass("secondary", "md", "mt-5")}>
        <RefreshCw aria-hidden className="size-4" />
        Try again
      </button>
    </div>
  );
}
