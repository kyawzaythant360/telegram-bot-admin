import { Suspense } from "react";
import { Gem, LogOut } from "lucide-react";

import { logout } from "@/app/actions";
import { BottomNav, BottomNavView, SidebarNav, SidebarNavView } from "@/components/nav";
import { buttonClass } from "@/components/ui";
import { isAuthenticated } from "@/lib/auth";
import { getStatusCounts } from "@/lib/queries";

const shopName = process.env.SHOP_NAME || "MLBB Diamond Shop";

/** Count of orders waiting for review; streams in after the shell renders. */
async function ReviewBadge() {
  if (!(await isAuthenticated())) return null;
  const count = (await getStatusCounts().catch(() => ({}) as Record<string, number>)).awaiting_review ?? 0;
  if (!count) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] leading-5 font-semibold text-on-danger">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> orders need review</span>
    </span>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label={compact ? "Sign out" : undefined}
        className={buttonClass("ghost", "sm", compact ? "size-10 px-0" : "w-full justify-start")}
      >
        <LogOut aria-hidden className="size-4" />
        {!compact && "Sign out"}
      </button>
    </form>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Gem aria-hidden className="size-4" />
      </span>
      <span className="truncate text-sm font-semibold text-ink">{shopName}</span>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/">) {
  const badge = (
    <Suspense fallback={null}>
      <ReviewBadge />
    </Suspense>
  );

  return (
    <div className="min-h-dvh md:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Suspense fallback={<SidebarNavView ordersBadge={badge} pathname={null} />}>
            <SidebarNav ordersBadge={badge} />
          </Suspense>
        </div>
        <div className="border-t border-line p-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <Brand />
        <LogoutButton compact />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:pt-8 md:pb-12 lg:px-8">
        {children}
      </main>

      <Suspense fallback={<BottomNavView ordersBadge={badge} pathname={null} />}>
        <BottomNav ordersBadge={badge} />
      </Suspense>
    </div>
  );
}
