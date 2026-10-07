"use client";

import { useState } from "react";

import { compactMoney, money } from "@/lib/format";
import { formatDayShort } from "@/lib/time";

type Point = { day: string; revenue: number; orders: number };

/** Round the axis maximum up to a friendly number (1, 2, 2.5, 5 x 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 10_000;
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value) ?? 10;
  return step * exp;
}

/**
 * Single-series bar chart: revenue per day.
 * One hue (--series-1), no legend needed (the card title names the series),
 * recessive grid, hover/tap tooltip, and a table view for screen readers.
 */
export function RevenueChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const labelEvery = data.length > 14 ? 5 : 1;
  const point = active === null ? null : data[active];

  // Keep the tooltip inside the chart at the left/right edges.
  const tooltipAlign =
    active === null ? "" : active < data.length * 0.2 ? "left" : active > data.length * 0.8 ? "right" : "center";

  return (
    <div>
      <div
        className="relative flex h-56 gap-2 sm:h-64"
        role="img"
        aria-label={`Revenue per day for the last ${data.length} days, ${money(total)} in total. A table view follows.`}
      >
        {/* Y axis labels */}
        <div aria-hidden className="flex w-9 shrink-0 flex-col justify-between pb-6 text-right text-[11px] text-ink-3 tabular-nums">
          <span>{compactMoney(max)}</span>
          <span>{compactMoney(max / 2)}</span>
          <span>0</span>
        </div>

        <div className="relative min-w-0 flex-1" onPointerLeave={() => setActive(null)}>
          {/* Grid lines: top, middle, baseline */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-6">
            <div className="absolute inset-x-0 top-0 border-t border-chart-grid" />
            <div className="absolute inset-x-0 top-1/2 border-t border-chart-grid" />
            <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" />
          </div>

          {/* Bars. Each column is a full-height hit target, wider than the bar itself. */}
          <div aria-hidden className="absolute inset-x-0 top-0 bottom-6 flex gap-0.5">
            {data.map((d, i) => (
              <div
                key={d.day}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              >
                {active === i && <div className="absolute inset-0 rounded bg-subtle" />}
                <div
                  className="relative w-full max-w-6 rounded-t bg-series-1"
                  style={{ height: d.revenue > 0 ? `max(${(d.revenue / max) * 100}%, 3px)` : 0 }}
                />
              </div>
            ))}
          </div>

          {/* X axis labels */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-5 gap-0.5 text-[11px] text-ink-3">
            {data.map((d, i) => (
              <div key={d.day} className="relative flex-1">
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {i === data.length - 1 ? "Today" : formatDayShort(d.day)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {point && active !== null && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
              style={{
                left:
                  tooltipAlign === "left" ? 0 : tooltipAlign === "right" ? undefined : `${((active + 0.5) / data.length) * 100}%`,
                right: tooltipAlign === "right" ? 0 : undefined,
                transform: tooltipAlign === "center" ? "translateX(-50%)" : undefined,
              }}
            >
              <div className="font-medium text-ink">{formatDayShort(point.day)}</div>
              <div className="mt-0.5 font-semibold text-ink tabular-nums">{money(point.revenue)}</div>
              <div className="text-ink-2">
                {point.orders} completed order{point.orders === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer rounded text-ink-2 hover:text-ink">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Revenue per day</caption>
            <thead className="text-xs text-ink-2">
              <tr>
                <th scope="col" className="py-1.5 font-medium">Day</th>
                <th scope="col" className="py-1.5 text-right font-medium">Completed</th>
                <th scope="col" className="py-1.5 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="py-1.5 text-ink">{formatDayShort(d.day)}</td>
                  <td className="py-1.5 text-right text-ink-2 tabular-nums">{d.orders}</td>
                  <td className="py-1.5 text-right text-ink tabular-nums">{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
