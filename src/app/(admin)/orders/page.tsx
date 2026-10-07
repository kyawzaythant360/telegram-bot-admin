import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText, Search } from "lucide-react";

import { OrdersList, Pagination } from "@/components/orders-list";
import { buttonClass, Card, cx, EmptyState, inputClass, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { isOrderStatus, ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/format";
import { getStatusCounts, listOrders } from "@/lib/queries";

export const metadata: Metadata = { title: "Orders" };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function ordersHref(params: { status?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/orders?${qs}` : "/orders";
}

export default async function OrdersPage(props: PageProps<"/orders">) {
  await requireAdmin();
  const params = await props.searchParams;
  const statusParam = first(params.status);
  const status: OrderStatus | undefined = isOrderStatus(statusParam) ? statusParam : undefined;
  const q = first(params.q).slice(0, 100);
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);

  const [result, counts] = await Promise.all([listOrders({ status, q, page }), getStatusCounts()]);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: Array<{ value?: OrderStatus; label: string; count: number }> = [
    { value: undefined, label: "All", count: allCount },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: counts[s] ?? 0 })),
  ];

  return (
    <>
      <PageHeader title="Orders" description="Approve or reject payments here or in Telegram; both stay in sync." />

      {/* Status filter: scrolls sideways inside itself on narrow screens. */}
      <nav aria-label="Filter by status" className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1.5">
          {tabs.map((tab) => {
            const selected = tab.value === status;
            return (
              <li key={tab.label}>
                <Link
                  href={ordersHref({ status: tab.value, q })}
                  aria-current={selected ? "page" : undefined}
                  className={cx(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                    selected
                      ? "border-ink bg-ink text-surface"
                      : "border-line-strong bg-surface text-ink-2 hover:bg-subtle hover:text-ink active:bg-line",
                  )}
                >
                  {tab.label}
                  <span className={cx("text-xs tabular-nums", selected ? "text-surface/80" : "text-ink-3")}>{tab.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/orders" className="mb-4 flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="order-search" className="sr-only">
          Search orders
        </label>
        <input
          id="order-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Order ID, Game ID, name or @username"
          className={inputClass}
        />
        <button type="submit" className={buttonClass("secondary", "md")}>
          <Search aria-hidden className="size-4" />
          <span className="hidden sm:inline">Search</span>
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </form>

      <Card bodyClassName="p-0 sm:p-0">
        {result.orders.length === 0 ? (
          <EmptyState icon={ReceiptText} title={q ? "No matching orders" : "No orders here"}>
            {q ? (
              <>
                Nothing matches &ldquo;{q}&rdquo;.{" "}
                <Link href={ordersHref({ status })} className="font-medium text-primary underline-offset-2 hover:underline">
                  Clear search
                </Link>
              </>
            ) : (
              "Orders appear here as soon as customers confirm them in the bot."
            )}
          </EmptyState>
        ) : (
          <>
            <OrdersList orders={result.orders} />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              hrefFor={(p) => ordersHref({ status, q, page: p })}
            />
          </>
        )}
      </Card>
    </>
  );
}
