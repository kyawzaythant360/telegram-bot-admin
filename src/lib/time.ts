// The shop runs on Myanmar time (UTC+06:30, no daylight saving). The bot stores
// `day` as YYYY-MM-DD and timestamps as ISO strings in this zone, so the panel
// must use the same zone for "today", ranges and new timestamps.

export const SHOP_TIMEZONE = "Asia/Yangon";
const OFFSET = "+06:30";

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** YYYY-MM-DD in shop time, `offsetDays` days from now (negative = past). */
export function shopDay(offsetDays = 0, from: Date = new Date()): string {
  return dayFormat.format(new Date(from.getTime() + offsetDays * 86_400_000));
}

/** ISO timestamp in shop time, matching Python's isoformat(timespec="seconds"). */
export function shopNowIso(from: Date = new Date()): string {
  return `${dayFormat.format(from)}T${timeFormat.format(from)}${OFFSET}`;
}

/** The last `count` days ending today, oldest first. */
export function lastDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => shopDay(i - count + 1));
}

/** "2026-10-07T17:50:12+06:30" -> "7 Oct 2026, 17:50" */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** "2026-10-07" -> "7 Oct" */
export function formatDayShort(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)));
}
