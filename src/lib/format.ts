export const CURRENCY = "MMK";

export function money(amount: number | string | null | undefined): string {
  return `${Number(amount ?? 0).toLocaleString("en-US")} ${CURRENCY}`;
}

export function compactMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}

export type OrderStatus =
  | "pending_payment"
  | "awaiting_review"
  | "completed"
  | "rejected"
  | "cancelled";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Waiting for payment",
  awaiting_review: "Needs review",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ORDER_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && value in STATUS_LABEL;
}

/** Parse "5500", "5,500", "5 500 MMK", "5500ks" into 5500. Mirrors the bot's parse_price. */
export const PRICE_MIN = 100;
export const PRICE_MAX = 10_000_000;
export const LABEL_MAX = 40;

export function parsePrice(input: unknown): number | null {
  const cleaned = String(input ?? "")
    .trim()
    .replace(/(mmk|kyats?|ks|[\s,_])/gi, "");
  if (!/^[0-9]+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= PRICE_MIN && value <= PRICE_MAX ? value : null;
}

export function cleanLabel(input: unknown): string | null {
  const label = String(input ?? "").split(/\s+/).filter(Boolean).join(" ");
  return label.length > 0 && label.length <= LABEL_MAX ? label : null;
}
