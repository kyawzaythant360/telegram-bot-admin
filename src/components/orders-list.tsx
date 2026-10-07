import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/ui";
import { money } from "@/lib/format";
import type { Order } from "@/lib/queries";
import { formatTimestamp } from "@/lib/time";

function customerName(order: Order): string {
  return order.full_name || (order.username ? `@${order.username}` : `User ${order.user_id}`);
}

/** Orders as a table on wide screens and as tappable cards on phones. */
export function OrdersList({ orders, showCustomer = true }: { orders: Order[]; showCustomer?: boolean }) {
  return (
    <>
      {/* Phones and small tablets */}
      <ul className="divide-y divide-line md:hidden">
        {orders.map((order) => (
          <li key={order.order_id}>
            <Link
              href={`/orders/${order.order_id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-subtle active:bg-line"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-ink-2">{order.order_id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-ink">{order.package_label}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">{money(order.price)}</span>
                </div>
                <div className="mt-0.5 flex justify-between gap-3 text-xs text-ink-2">
                  <span className="truncate">{showCustomer ? customerName(order) : `ID ${order.game_id} (${order.server_id})`}</span>
                  <span className="shrink-0">{formatTimestamp(order.created_at)}</span>
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
              <th scope="col" className="px-5 py-2.5 font-medium">Order</th>
              {showCustomer && <th scope="col" className="px-3 py-2.5 font-medium">Customer</th>}
              <th scope="col" className="px-3 py-2.5 font-medium">Package</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Amount</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Game ID</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <tr key={order.order_id} className="group relative transition-colors hover:bg-subtle">
                <td className="px-5 py-3">
                  {/* The link covers the whole row so any cell is clickable. */}
                  <Link
                    href={`/orders/${order.order_id}`}
                    className="font-mono text-xs font-medium text-ink after:absolute after:inset-0 after:content-['']"
                  >
                    {order.order_id}
                  </Link>
                </td>
                {showCustomer && <td className="max-w-48 truncate px-3 py-3 text-ink">{customerName(order)}</td>}
                <td className="px-3 py-3 text-ink">{order.package_label}</td>
                <td className="px-3 py-3 text-right font-medium text-ink tabular-nums">{money(order.price)}</td>
                <td className="px-3 py-3 font-mono text-xs text-ink-2">
                  {order.game_id} ({order.server_id})
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap text-ink-2">{formatTimestamp(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const linkClass =
    "inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-subtle active:bg-line";
  const disabledClass =
    "inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink-3 opacity-60";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>Previous</Link>
      ) : (
        <span aria-disabled className={disabledClass}>Previous</span>
      )}
      <span className="text-sm text-ink-2">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>Next</Link>
      ) : (
        <span aria-disabled className={disabledClass}>Next</span>
      )}
    </nav>
  );
}
