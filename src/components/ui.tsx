import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Ban, CircleCheck, CircleX, Clock, Eye, type LucideIcon } from "lucide-react";

import { STATUS_LABEL, type OrderStatus } from "@/lib/format";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// --------------------------------------------------------------------------- //
// Buttons: default, hover, active, focus-visible (global), disabled, loading.
// --------------------------------------------------------------------------- //
type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "danger-ghost" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-subtle active:bg-line",
  danger: "bg-danger text-on-danger hover:bg-danger-hover active:bg-danger-active",
  // Triggers for destructive actions: red text, confirm step uses `danger`.
  "danger-outline": "border border-line-strong bg-surface text-danger-ink hover:bg-danger-soft active:bg-danger-soft",
  "danger-ghost": "text-danger-ink hover:bg-danger-soft active:bg-danger-soft",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink active:bg-line",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string): string {
  return cx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap",
    "transition-colors duration-150 select-none",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// --------------------------------------------------------------------------- //
// Layout pieces
// --------------------------------------------------------------------------- //
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-semibold tracking-tight text-ink break-words">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("min-w-0 rounded-xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cx("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-subtle text-ink-3">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-2">{children}</div>}
    </div>
  );
}

export function DefinitionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-ink-2">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink break-words">{children}</dd>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Status badge: colour + icon + label, never colour alone.
// --------------------------------------------------------------------------- //
const STATUS_STYLE: Record<OrderStatus, { icon: LucideIcon; className: string }> = {
  pending_payment: { icon: Clock, className: "bg-neutral-soft text-neutral-ink" },
  awaiting_review: { icon: Eye, className: "bg-warning-soft text-warning-ink" },
  completed: { icon: CircleCheck, className: "bg-success-soft text-success-ink" },
  rejected: { icon: CircleX, className: "bg-danger-soft text-danger-ink" },
  cancelled: { icon: Ban, className: "bg-neutral-soft text-neutral-ink" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.cancelled;
  const Icon = style.icon;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        style.className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// --------------------------------------------------------------------------- //
// Form fields
// --------------------------------------------------------------------------- //
export const inputClass = cx(
  "h-11 w-full min-w-0 rounded-lg border border-field bg-surface px-3 text-base text-ink sm:text-sm",
  "placeholder:text-ink-3 hover:border-ink-2",
  "focus-visible:border-focus disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger",
);

export const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export function FormMessage({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cx("text-sm", state.ok ? "text-success-ink" : "text-danger-ink")}
    >
      {state.message}
    </p>
  );
}
