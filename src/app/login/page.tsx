import type { Metadata } from "next";
import { Suspense } from "react";
import { Gem } from "lucide-react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const shopName = process.env.SHOP_NAME || "MLBB Diamond Shop";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-on-primary">
            <Gem aria-hidden className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{shopName}</h1>
          <p className="mt-1 text-sm text-ink-2">Admin panel</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          {/* searchParams is request data, so it is read inside Suspense. */}
          <Suspense fallback={<LoginForm next="/" />}>
            <LoginFormWithNext searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/"} />;
}
