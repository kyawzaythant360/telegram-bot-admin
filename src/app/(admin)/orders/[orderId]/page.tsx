import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, ImageOff } from "lucide-react";

import { CopyButton } from "@/components/client-ui";
import { MessageCustomerForm, OrderDecision } from "@/components/order-actions";
import { Card, DefinitionRow, PageHeader, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { getOrder } from "@/lib/queries";
import { formatTimestamp } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/orders/[orderId]">): Promise<Metadata> {
  const { orderId } = await props.params;
  return { title: orderId };
}

export default async function OrderPage(props: PageProps<"/orders/[orderId]">) {
  await requireAdmin();
  const { orderId } = await props.params;
  const order = await getOrder(decodeURIComponent(orderId));
  if (!order) notFound();

  const name = order.full_name || "Customer";
  const hasScreenshot = Boolean(order.screenshot_file_id);
  const screenshotUrl = `/api/screenshot/${encodeURIComponent(order.order_id)}`;

  return (
    <>
      <PageHeader
        back={
          <Link
            href="/orders"
            className="mb-2 -ml-1 inline-flex items-center gap-1 rounded text-sm text-ink-2 hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-4" />
            Orders
          </Link>
        }
        title={<span className="font-mono">{order.order_id}</span>}
        description={`Created ${formatTimestamp(order.created_at)}`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card title={order.status === "awaiting_review" ? "Review payment" : "Action"}>
            <OrderDecision orderId={order.order_id} status={order.status} />
          </Card>

          <Card title="Top-up details">
            <p className="mb-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{money(order.price)}</p>
            <p className="mb-4 text-sm text-ink-2">{order.package_label}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyField label="Game ID" value={order.game_id} />
              <CopyField label="Server ID" value={order.server_id} />
            </div>
          </Card>

          <Card title="Customer">
            <dl className="divide-y divide-line">
              <DefinitionRow label="Name">{name}</DefinitionRow>
              <DefinitionRow label="Username">
                {order.username ? (
                  <a
                    href={`https://t.me/${order.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                  >
                    @{order.username}
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-ink-2">None</span>
                )}
              </DefinitionRow>
              <DefinitionRow label="Telegram ID">
                <span className="font-mono text-xs">{order.user_id}</span>
              </DefinitionRow>
            </dl>
            <Link
              href={`/customers/${order.user_id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              All orders from this customer
            </Link>
          </Card>

          <Card title="Message the customer">
            <MessageCustomerForm userId={order.user_id} orderId={order.order_id} />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card
            title="Payment screenshot"
            action={
              hasScreenshot && (
                <a
                  href={screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
                >
                  Full size
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              )
            }
          >
            {hasScreenshot ? (
              <a href={screenshotUrl} target="_blank" rel="noreferrer" className="block">
                {/* Served through our own API route, which fetches it from Telegram. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt={`Payment screenshot for ${order.order_id}`}
                  className="mx-auto max-h-[70vh] w-auto rounded-lg border border-line bg-subtle object-contain"
                />
              </a>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <ImageOff aria-hidden className="mb-2 size-6 text-ink-3" />
                <p className="text-sm text-ink-2">The customer hasn&apos;t sent a screenshot yet.</p>
              </div>
            )}
          </Card>

          <Card title="History">
            <dl className="divide-y divide-line">
              <DefinitionRow label="Created">{formatTimestamp(order.created_at)}</DefinitionRow>
              <DefinitionRow label="Last update">{formatTimestamp(order.updated_at)}</DefinitionRow>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-subtle py-1.5 pr-1.5 pl-3">
      <div className="min-w-0">
        <div className="text-xs text-ink-2">{label}</div>
        <div className="truncate font-mono text-lg font-semibold text-ink">{value}</div>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}
