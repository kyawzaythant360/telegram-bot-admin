import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";

import { MessageCustomerForm } from "@/components/order-actions";
import { OrdersList, Pagination } from "@/components/orders-list";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { getCustomer, listOrders } from "@/lib/queries";
import { formatTimestamp } from "@/lib/time";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage(props: PageProps<"/customers/[userId]">) {
  await requireAdmin();
  const { userId: rawId } = await props.params;
  const { page: pageParam } = await props.searchParams;
  const userId = Number(rawId);
  if (!Number.isSafeInteger(userId)) notFound();
  const page = Math.max(1, Number.parseInt(String(pageParam ?? ""), 10) || 1);

  const [customer, orders] = await Promise.all([getCustomer(userId), listOrders({ userId, page })]);
  if (!customer) notFound();

  const name = customer.full_name || (customer.username ? `@${customer.username}` : `User ${userId}`);

  return (
    <>
      <PageHeader
        back={
          <Link href="/customers" className="mb-2 -ml-1 inline-flex items-center gap-1 rounded text-sm text-ink-2 hover:text-ink">
            <ChevronLeft aria-hidden className="size-4" />
            Customers
          </Link>
        }
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {customer.username && (
              <a
                href={`https://t.me/${customer.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              >
                @{customer.username}
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            )}
            <span className="font-mono text-xs">ID {userId}</span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-medium text-ink-2">Total spent</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink tabular-nums">{money(customer.spent)}</p>
        </section>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-medium text-ink-2">Orders</h2>
          <p className="mt-2 text-2xl font-semibold text-ink tabular-nums">
            {customer.completed} <span className="text-base font-normal text-ink-2">of {customer.orders} completed</span>
          </p>
        </section>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-medium text-ink-2">Last order</h2>
          <p className="mt-2 text-lg font-semibold text-ink">{formatTimestamp(customer.last_order_at)}</p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Orders" className="lg:col-span-2" bodyClassName="p-0 sm:p-0">
          <OrdersList orders={orders.orders} showCustomer={false} />
          <Pagination
            page={orders.page}
            pageCount={orders.pageCount}
            hrefFor={(p) => (p > 1 ? `/customers/${userId}?page=${p}` : `/customers/${userId}`)}
          />
        </Card>
        <Card title="Message this customer">
          <MessageCustomerForm userId={userId} />
        </Card>
      </div>
    </>
  );
}
