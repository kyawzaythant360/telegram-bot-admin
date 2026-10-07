"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { cleanLabel, parsePrice, PRICE_MAX, PRICE_MIN, LABEL_MAX } from "@/lib/format";
import * as messages from "@/lib/messages";
import * as q from "@/lib/queries";
import {
  checkPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { adminChatId, callTelegram, sendMessage } from "@/lib/telegram";

export type ActionResult = { ok: boolean; message: string } | null;

const MESSAGE_MAX = 2000;

function refreshAll() {
  // Nothing is cached, but this tells the client router to drop stale pages.
  revalidatePath("/", "layout");
}

// --------------------------------------------------------------------------- //
// Auth
// --------------------------------------------------------------------------- //
export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!process.env.ADMIN_PASSWORD) {
    return { ok: false, message: "ADMIN_PASSWORD is not set on the server. Add it in Vercel and redeploy." };
  }
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slow down guessing
    return { ok: false, message: "That password is not correct." };
  }
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  const next = String(formData.get("next") ?? "");
  // Only allow same-site paths ("/orders"), never "//evil.com" or full URLs.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// --------------------------------------------------------------------------- //
// Orders
// --------------------------------------------------------------------------- //
/** Approve / reject (awaiting_review) or cancel (pending_payment) an order. */
export async function decideOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, MESSAGE_MAX);

  const transitions = {
    approve: { from: "awaiting_review", to: "completed" },
    reject: { from: "awaiting_review", to: "rejected" },
    cancel: { from: "pending_payment", to: "cancelled" },
  } as const;
  if (!(decision in transitions)) return { ok: false, message: "Unknown action." };
  const { from, to } = transitions[decision as keyof typeof transitions];

  const order = await q.setOrderStatusIf(orderId, from, to);
  if (!order) {
    refreshAll();
    return {
      ok: false,
      message: "This order was already handled (maybe from Telegram). The page now shows its current status.",
    };
  }

  const warnings: string[] = [];

  // 1. Tell the customer (same text the bot sends).
  if (decision !== "cancel") {
    try {
      await sendMessage(
        order.user_id,
        decision === "approve" ? messages.orderApproved(order.order_id) : messages.orderRejected(order.order_id),
      );
      if (decision === "reject" && reason) {
        await sendMessage(order.user_id, messages.messageFromShop(reason, order.order_id));
      }
    } catch (error) {
      warnings.push(`the customer could not be messaged on Telegram (${(error as Error).message})`);
    }
  }

  // 2. Keep the admin's Telegram card in sync: remove its buttons and note the decision.
  const adminChat = adminChatId();
  if (adminChat && order.admin_msg_id && decision !== "cancel") {
    try {
      await callTelegram("editMessageReplyMarkup", {
        chat_id: adminChat,
        message_id: order.admin_msg_id,
        reply_markup: { inline_keyboard: [] },
      });
      await sendMessage(adminChat, messages.adminWebDecision(order.order_id, decision === "approve"), {
        reply_parameters: { message_id: order.admin_msg_id, allow_sending_without_reply: true },
      });
    } catch {
      /* the card may be too old to edit - not important */
    }
  }

  refreshAll();
  const done = { approve: "Approved", reject: "Rejected", cancel: "Cancelled" }[decision as keyof typeof transitions];
  return warnings.length
    ? { ok: false, message: `${done}, but ${warnings.join("; ")}.` }
    : {
        ok: true,
        message:
          decision === "cancel" ? `${done}.` : `${done}. The customer was notified on Telegram.`,
      };
}

// --------------------------------------------------------------------------- //
// Customers
// --------------------------------------------------------------------------- //
export async function messageCustomer(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const userId = Number(formData.get("userId"));
  const orderId = String(formData.get("orderId") ?? "") || undefined;
  const text = String(formData.get("text") ?? "").trim();
  if (!Number.isFinite(userId) || userId === 0) return { ok: false, message: "Unknown customer." };
  if (!text) return { ok: false, message: "Write a message first." };
  if (text.length > MESSAGE_MAX) return { ok: false, message: `Keep it under ${MESSAGE_MAX} characters.` };
  try {
    await sendMessage(userId, messages.messageFromShop(text, orderId));
    return { ok: true, message: "Sent. The customer received it from the bot." };
  } catch (error) {
    return {
      ok: false,
      message: `Telegram refused the message: ${(error as Error).message}. The customer may have blocked the bot.`,
    };
  }
}

// --------------------------------------------------------------------------- //
// Packages
// --------------------------------------------------------------------------- //
function readPackageForm(formData: FormData): { label: string; price: number } | string {
  const label = cleanLabel(formData.get("label"));
  if (!label) return `Name must be 1-${LABEL_MAX} characters.`;
  const price = parsePrice(formData.get("price"));
  if (price === null) {
    return `Price must be a whole number between ${PRICE_MIN.toLocaleString("en-US")} and ${PRICE_MAX.toLocaleString("en-US")}.`;
  }
  return { label, price };
}

export async function savePackage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = readPackageForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };
  const saved = await q.updatePackage(String(formData.get("key")), parsed.label, parsed.price);
  refreshAll();
  return saved
    ? { ok: true, message: "Saved. Customers see it now." }
    : { ok: false, message: "This package no longer exists." };
}

export async function createPackage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = readPackageForm(formData);
  if (typeof parsed === "string") return { ok: false, message: parsed };
  await q.addPackage(parsed.label, parsed.price);
  refreshAll();
  return { ok: true, message: `Added ${parsed.label}.` };
}

export async function removePackage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const removed = await q.deletePackage(String(formData.get("key")));
  refreshAll();
  return removed ? { ok: true, message: "Deleted." } : { ok: false, message: "Already deleted." };
}

export async function reorderPackage(formData: FormData): Promise<void> {
  await requireAdmin();
  const direction = formData.get("direction") === "up" ? -1 : 1;
  await q.movePackage(String(formData.get("key")), direction);
  refreshAll();
}
