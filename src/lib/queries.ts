import "server-only";
import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/format";
import { lastDays, shopDay, shopNowIso } from "@/lib/time";

// Tables are created and owned by the Telegram bot (db.py). The panel reads
// and updates the same rows, so both sides always agree.

export type Order = {
  id: number;
  order_id: string;
  day: string;
  user_id: number;
  username: string | null;
  full_name: string | null;
  package_key: string;
  package_label: string;
  price: number;
  game_id: string;
  server_id: string;
  status: OrderStatus;
  screenshot_file_id: string | null;
  admin_msg_id: number | null;
  created_at: string;
  updated_at: string;
};

export type Package = {
  key: string;
  label: string;
  price: number;
  sort_order: number;
};

export type Customer = {
  user_id: number;
  username: string | null;
  full_name: string | null;
  orders: number;
  completed: number;
  spent: number;
  last_order_at: string;
};

const PAGE_SIZE = 20;
const ORDER_COLUMNS = `id::int, order_id, day, user_id::float8 AS user_id, username, full_name,
  package_key, package_label, price::int, game_id, server_id, status, screenshot_file_id,
  admin_msg_id::float8 AS admin_msg_id, created_at, updated_at`;

// --------------------------------------------------------------------------- //
// Dashboard
// --------------------------------------------------------------------------- //
export type RangeStats = { orders: number; completed: number; revenue: number };

export type Dashboard = {
  today: RangeStats;
  week: RangeStats;
  month: RangeStats;
  awaitingReview: number;
  waitingPayment: number;
};

export async function getDashboard(): Promise<Dashboard> {
  const sql = db();
  const today = shopDay(0);
  const week = shopDay(-6);
  const month = shopDay(-29);
  const [row] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE day = ${today})::int AS orders_today,
      COUNT(*) FILTER (WHERE day >= ${week})::int AS orders_week,
      COUNT(*) FILTER (WHERE day >= ${month})::int AS orders_month,
      COUNT(*) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) = ${today})::int AS completed_today,
      COUNT(*) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${week})::int AS completed_week,
      COUNT(*) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${month})::int AS completed_month,
      COALESCE(SUM(price) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) = ${today}), 0)::float8 AS revenue_today,
      COALESCE(SUM(price) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${week}), 0)::float8 AS revenue_week,
      COALESCE(SUM(price) FILTER (WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${month}), 0)::float8 AS revenue_month,
      COUNT(*) FILTER (WHERE status = 'awaiting_review')::int AS awaiting_review,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::int AS waiting_payment
    FROM orders`;
  return {
    today: { orders: row.orders_today, completed: row.completed_today, revenue: row.revenue_today },
    week: { orders: row.orders_week, completed: row.completed_week, revenue: row.revenue_week },
    month: { orders: row.orders_month, completed: row.completed_month, revenue: row.revenue_month },
    awaitingReview: row.awaiting_review,
    waitingPayment: row.waiting_payment,
  };
}

export type DayRevenue = { day: string; revenue: number; orders: number };

/** Completed-order revenue per day for the last `days` days (zero-filled). */
export async function getRevenueByDay(days: number): Promise<DayRevenue[]> {
  const range = lastDays(days);
  const rows = await db()`
    SELECT substr(updated_at, 1, 10) AS day, SUM(price)::float8 AS revenue, COUNT(*)::int AS orders
    FROM orders
    WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${range[0]}
    GROUP BY 1`;
  const byDay = new Map(rows.map((r) => [r.day as string, r]));
  return range.map((day) => ({
    day,
    revenue: byDay.get(day)?.revenue ?? 0,
    orders: byDay.get(day)?.orders ?? 0,
  }));
}

export type TopPackage = { label: string; orders: number; revenue: number };

export async function getTopPackages(days: number, limit = 5): Promise<TopPackage[]> {
  const rows = await db()`
    SELECT package_label AS label, COUNT(*)::int AS orders, SUM(price)::float8 AS revenue
    FROM orders
    WHERE status = 'completed' AND substr(updated_at, 1, 10) >= ${shopDay(1 - days)}
    GROUP BY package_label
    ORDER BY revenue DESC, orders DESC
    LIMIT ${limit}`;
  return rows as unknown as TopPackage[];
}

// --------------------------------------------------------------------------- //
// Orders
// --------------------------------------------------------------------------- //
export type OrderFilter = { status?: OrderStatus; q?: string; page?: number; userId?: number };

export async function listOrders({ status, q = "", page = 1, userId }: OrderFilter) {
  const sql = db();
  const term = q.trim();
  const like = `%${term}%`;
  const offset = (Math.max(page, 1) - 1) * PAGE_SIZE;
  const rows = await sql`
    SELECT ${sql.unsafe(ORDER_COLUMNS)}, COUNT(*) OVER()::int AS total
    FROM orders
    WHERE TRUE
      ${status ? sql`AND status = ${status}` : sql``}
      ${userId ? sql`AND user_id = ${userId}` : sql``}
      ${term
        ? sql`AND (order_id ILIKE ${like} OR game_id ILIKE ${like} OR username ILIKE ${like}
               OR full_name ILIKE ${like} OR user_id::text = ${term})`
        : sql``}
    ORDER BY id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
  const total = rows.length ? (rows[0].total as number) : 0;
  return {
    orders: rows as unknown as Order[],
    total,
    page: Math.max(page, 1),
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getStatusCounts(): Promise<Record<string, number>> {
  const rows = await db()`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`;
  return Object.fromEntries(rows.map((r) => [r.status as string, r.n as number]));
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const sql = db();
  const [row] = await sql`SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders WHERE order_id = ${orderId}`;
  return (row as Order | undefined) ?? null;
}

/** Atomic status change: only succeeds if the order is still in `expected`.
 *  The bot uses the same rule, so Telegram and the web can never both win. */
export async function setOrderStatusIf(
  orderId: string,
  expected: OrderStatus,
  next: OrderStatus,
): Promise<Order | null> {
  const sql = db();
  const [row] = await sql`
    UPDATE orders SET status = ${next}, updated_at = ${shopNowIso()}
    WHERE order_id = ${orderId} AND status = ${expected}
    RETURNING ${sql.unsafe(ORDER_COLUMNS)}`;
  return (row as Order | undefined) ?? null;
}

// --------------------------------------------------------------------------- //
// Packages
// --------------------------------------------------------------------------- //
export async function listPackages(): Promise<Package[]> {
  const rows = await db()`
    SELECT key, label, price::int, sort_order::int FROM packages
    WHERE active = 1 ORDER BY sort_order, key`;
  return rows as unknown as Package[];
}

export async function updatePackage(key: string, label: string, price: number): Promise<boolean> {
  const rows = await db()`
    UPDATE packages SET label = ${label}, price = ${price}
    WHERE key = ${key} AND active = 1 RETURNING key`;
  return rows.length === 1;
}

export async function addPackage(label: string, price: number): Promise<string> {
  const key = `p${randomBytes(3).toString("hex")}`;
  await db()`
    INSERT INTO packages (key, label, price, sort_order, active)
    SELECT ${key}, ${label}, ${price}, COALESCE(MAX(sort_order), -1) + 1, 1 FROM packages`;
  return key;
}

export async function deletePackage(key: string): Promise<boolean> {
  const rows = await db()`
    UPDATE packages SET active = 0 WHERE key = ${key} AND active = 1 RETURNING key`;
  return rows.length === 1;
}

/** Swap a package with its neighbour above (-1) or below (+1). */
export async function movePackage(key: string, direction: -1 | 1): Promise<void> {
  await db().begin(async (tx) => {
    const list = await tx`
      SELECT key, sort_order::int FROM packages WHERE active = 1
      ORDER BY sort_order, key FOR UPDATE`;
    const index = list.findIndex((p) => p.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    // Renumber everything 0..n-1 with the two swapped; robust to duplicate sort_order values.
    const keys = list.map((p) => p.key as string);
    [keys[index], keys[target]] = [keys[target], keys[index]];
    for (const [position, k] of keys.entries()) {
      await tx`UPDATE packages SET sort_order = ${position} WHERE key = ${k}`;
    }
  });
}

// --------------------------------------------------------------------------- //
// Customers
// --------------------------------------------------------------------------- //
const CUSTOMER_SELECT = `
  SELECT user_id::float8 AS user_id,
         (array_agg(username ORDER BY id DESC))[1] AS username,
         (array_agg(full_name ORDER BY id DESC))[1] AS full_name,
         COUNT(*)::int AS orders,
         (COUNT(*) FILTER (WHERE status = 'completed'))::int AS completed,
         COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0)::float8 AS spent,
         MAX(created_at) AS last_order_at,
         MAX(id) AS last_id
  FROM orders`;

export async function listCustomers({ q = "", page = 1 }: { q?: string; page?: number }) {
  const sql = db();
  const term = q.trim();
  const like = `%${term}%`;
  const offset = (Math.max(page, 1) - 1) * PAGE_SIZE;
  const rows = await sql`
    WITH c AS (${sql.unsafe(CUSTOMER_SELECT)} GROUP BY user_id)
    SELECT *, COUNT(*) OVER()::int AS total FROM c
    WHERE TRUE
      ${term
        ? sql`AND (username ILIKE ${like} OR full_name ILIKE ${like} OR user_id::bigint::text = ${term})`
        : sql``}
    ORDER BY last_id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
  const total = rows.length ? (rows[0].total as number) : 0;
  return {
    customers: rows as unknown as Customer[],
    total,
    page: Math.max(page, 1),
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCustomer(userId: number): Promise<Customer | null> {
  const sql = db();
  const [row] = await sql`${sql.unsafe(CUSTOMER_SELECT)} WHERE user_id = ${userId} GROUP BY user_id`;
  return (row as Customer | undefined) ?? null;
}
