import Link from "next/link";
import { ArrowRight, Eye, ReceiptText } from "lucide-react";

import { OrdersList } from "@/components/orders-list";
import { RevenueChart } from "@/components/revenue-chart";
import { ButtonLink, Card, cx, EmptyState, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { getDashboard, getRevenueByDay, getTopPackages, listOrders } from "@/lib/queries";
import { shopDay } from "@/lib/time";

const RANGES = [7, 30] as const;

function longDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default async function DashboardPage(props: PageProps<"/">) {
  await requireAdmin();
  const { range: rangeParam } = await props.searchParams;
  const range = rangeParam === "7" ? 7 : 30;

  const [stats, revenue, top, recent] = await Promise.all([
    getDashboard(),
    getRevenueByDay(range),
    getTopPackages(30),
    listOrders({ page: 1 }),
  ]);
  const topMax = Math.max(1, ...top.map((t) => t.revenue));

  return (
    <>
      <PageHeader title="Dashboard" description={longDate(shopDay(0))} />

      {stats.awaitingReview > 0 && (
        <Link
          href="/orders?status=awaiting_review"
          className="mb-4 flex items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-warning-ink transition-opacity hover:opacity-90"
        >
          <Eye aria-hidden className="size-5 shrink-0" />
          <span className="flex-1 text-sm font-medium">
            {stats.awaitingReview} payment{stats.awaitingReview === 1 ? "" : "s"} waiting for your review
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            Review <ArrowRight aria-hidden className="size-4" />
          </span>
        </Link>
      )}

      {/* Headline numbers: today's revenue leads. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section className="rounded-xl border border-line bg-surface p-5 sm:col-span-2 sm:p-6">
          <h2 className="text-sm font-medium text-ink-2">Revenue today</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-ink tabular-nums sm:text-5xl">
            {money(stats.today.revenue)}
          </p>
          <p className="mt-3 text-sm text-ink-2">
            {stats.today.completed} completed &middot; {stats.today.orders} new order{stats.today.orders === 1 ? "" : "s"}{" "}
            &middot; {stats.waitingPayment} waiting for payment
          </p>
        </section>
        <StatTile label="Last 7 days" value={money(stats.week.revenue)} detail={`${stats.week.completed} completed`} />
        <StatTile label="Last 30 days" value={money(stats.month.revenue)} detail={`${stats.month.completed} completed`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Revenue per day"
          action={
            <div role="group" aria-label="Date range" className="flex rounded-lg bg-subtle p-0.5">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={r === 30 ? "/" : `/?range=${r}`}
                  scroll={false}
                  aria-current={range === r ? "true" : undefined}
                  className={cx(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    range === r ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {r} days
                </Link>
              ))}
            </div>
          }
        >
          <RevenueChart data={revenue} />
        </Card>

        <Card title="Best sellers, 30 days">
          {top.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-2">No completed orders yet.</p>
          ) : (
            <ol className="space-y-4">
              {top.map((t) => (
                <li key={t.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">{t.label}</span>
                    <span className="shrink-0 text-ink tabular-nums">{money(t.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-subtle" aria-hidden>
                      <div className="h-2 rounded-full bg-series-1" style={{ width: `${(t.revenue / topMax) * 100}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-ink-2 tabular-nums">
                      {t.orders} sold
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Latest orders"
        action={<ButtonLink href="/orders" variant="ghost" size="sm">View all</ButtonLink>}
        bodyClassName="p-0 sm:p-0"
      >
        {recent.orders.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No orders yet">
            Orders appear here as soon as customers confirm them in the bot.
          </EmptyState>
        ) : (
          <OrdersList orders={recent.orders.slice(0, 8)} />
        )}
      </Card>
    </>
  );
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-medium text-ink-2">{label}</h2>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-2">{detail}</p>
    </section>
  );
}
