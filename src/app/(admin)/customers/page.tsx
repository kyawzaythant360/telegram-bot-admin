import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";

import { Pagination } from "@/components/orders-list";
import { buttonClass, Card, EmptyState, inputClass, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { listCustomers, type Customer } from "@/lib/queries";
import { formatTimestamp } from "@/lib/time";

export const metadata: Metadata = { title: "Customers" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function customersHref(q: string, page = 1) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/customers?${qs}` : "/customers";
}

function displayName(c: Customer) {
  return c.full_name || (c.username ? `@${c.username}` : `User ${c.user_id}`);
}

export default async function CustomersPage(props: PageProps<"/customers">) {
  await requireAdmin();
  const params = await props.searchParams;
  const q = first(params.q).slice(0, 100);
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);
  const result = await listCustomers({ q, page });

  return (
    <>
      <PageHeader title="Customers" description={`${result.total} customer${result.total === 1 ? "" : "s"} have ordered through the bot.`} />

      <form action="/customers" className="mb-4 flex gap-2" role="search">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Name, @username or Telegram ID"
          className={inputClass}
        />
        <button type="submit" className={buttonClass("secondary", "md")}>
          <Search aria-hidden className="size-4" />
          <span className="hidden sm:inline">Search</span>
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </form>

      <Card bodyClassName="p-0 sm:p-0">
        {result.customers.length === 0 ? (
          <EmptyState icon={Users} title={q ? "No matching customers" : "No customers yet"}>
            {q ? `Nothing matches "${q}".` : "Customers appear after their first order."}
          </EmptyState>
        ) : (
          <>
            {/* Phones */}
            <ul className="divide-y divide-line md:hidden">
              {result.customers.map((c) => (
                <li key={c.user_id}>
                  <Link
                    href={`/customers/${c.user_id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-subtle active:bg-line"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium text-ink">{displayName(c)}</span>
                        <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">{money(c.spent)}</span>
                      </div>
                      <div className="mt-0.5 flex justify-between gap-3 text-xs text-ink-2">
                        <span className="truncate">
                          {c.username ? `@${c.username}` : `ID ${c.user_id}`} &middot; {c.completed}/{c.orders} completed
                        </span>
                        <span className="shrink-0">{formatTimestamp(c.last_order_at)}</span>
                      </div>
                    </div>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">Customer</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Telegram ID</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Orders</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Completed</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Total spent</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.customers.map((c) => (
                    <tr key={c.user_id} className="relative transition-colors hover:bg-subtle">
                      <td className="px-5 py-3">
                        <Link
                          href={`/customers/${c.user_id}`}
                          className="font-medium text-ink after:absolute after:inset-0 after:content-['']"
                        >
                          {displayName(c)}
                        </Link>
                        {c.username && c.full_name && <div className="text-xs text-ink-2">@{c.username}</div>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-ink-2">{c.user_id}</td>
                      <td className="px-3 py-3 text-right text-ink tabular-nums">{c.orders}</td>
                      <td className="px-3 py-3 text-right text-ink tabular-nums">{c.completed}</td>
                      <td className="px-3 py-3 text-right font-medium text-ink tabular-nums">{money(c.spent)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap text-ink-2">{formatTimestamp(c.last_order_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => customersHref(q, p)} />
          </>
        )}
      </Card>
    </>
  );
}
