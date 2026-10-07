"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Gem, LayoutDashboard, ReceiptText, Users, type LucideIcon } from "lucide-react";

import { cx } from "@/components/ui";

type NavItem = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean };

const ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { href: "/orders", label: "Orders", icon: ReceiptText, match: (p) => p.startsWith("/orders") },
  { href: "/packages", label: "Packages", icon: Gem, match: (p) => p.startsWith("/packages") },
  { href: "/customers", label: "Customers", icon: Users, match: (p) => p.startsWith("/customers") },
];

type NavProps = { ordersBadge?: ReactNode };

// The current path is request data, so each nav has a pure "view" (used as the
// instant Suspense fallback, nothing highlighted) and a wrapper that reads it.
export function SidebarNav(props: NavProps) {
  return <SidebarNavView {...props} pathname={usePathname()} />;
}

export function BottomNav(props: NavProps) {
  return <BottomNavView {...props} pathname={usePathname()} />;
}

/** Vertical list for the desktop sidebar. `ordersBadge` streams in from the server. */
export function SidebarNavView({ ordersBadge, pathname }: NavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = pathname !== null && match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-subtle text-ink"
                : "text-ink-2 hover:bg-subtle hover:text-ink active:bg-line",
            )}
          >
            <Icon aria-hidden className={cx("size-4.5", active ? "text-primary" : "text-ink-3")} />
            <span className="flex-1">{label}</span>
            {href === "/orders" && ordersBadge}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed bottom tab bar for phones. */
export function BottomNavView({ ordersBadge, pathname }: NavProps & { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = pathname !== null && match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-ink-2 hover:text-ink active:bg-subtle",
                )}
              >
                <span className="relative">
                  <Icon aria-hidden className="size-5" />
                  {href === "/orders" && <span className="absolute -top-2 left-3">{ordersBadge}</span>}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
