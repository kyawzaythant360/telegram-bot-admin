"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { login, type ActionResult } from "@/app/actions";
import { buttonClass, FormMessage, inputClass, labelClass } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(login, null);
  const failed = state !== null && !state.ok;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={failed || undefined}
          aria-describedby={failed ? "login-error" : undefined}
          className={inputClass}
        />
      </div>
      <div id="login-error">
        <FormMessage state={state} />
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary", "md", "w-full")}>
        {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
