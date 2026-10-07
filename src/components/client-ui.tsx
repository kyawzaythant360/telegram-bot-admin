"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, LoaderCircle } from "lucide-react";

import { buttonClass } from "@/components/ui";

/** Submit button with a loading state driven by the parent <form>. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "danger-outline" | "danger-ghost" | "ghost";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // When several submit buttons share a form, only the one that was pressed spins.
  const isMine = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled || pending}
      aria-busy={isMine || undefined}
      className={buttonClass(variant, size, className)}
    >
      {isMine && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {isMine && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Copies text to the clipboard; handy for Game ID / Server ID while topping up. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (e.g. insecure origin) - the value is still visible */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className={buttonClass("ghost", "sm", "size-9 px-0")}
    >
      {copied ? <Check aria-hidden className="size-4 text-success-ink" /> : <Copy aria-hidden className="size-4" />}
    </button>
  );
}
