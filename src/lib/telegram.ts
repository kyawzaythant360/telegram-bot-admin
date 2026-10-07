import "server-only";

// Minimal Telegram Bot API client. The panel uses the same bot token as the
// bot, so messages to customers come from the shop's bot as usual.
// TELEGRAM_API_URL can point at a fake server in tests.

const API_BASE = (process.env.TELEGRAM_API_URL || "https://api.telegram.org").replace(/\/$/, "");

export class TelegramError extends Error {}

function token(): string {
  const t = process.env.BOT_TOKEN;
  if (!t) throw new TelegramError("BOT_TOKEN is not set in the panel's environment variables.");
  return t;
}

export async function callTelegram<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as
    | { ok: true; result: T }
    | { ok: false; description?: string }
    | null;
  if (!json || !json.ok) {
    throw new TelegramError(json && !json.ok && json.description ? json.description : `HTTP ${res.status}`);
  }
  return json.result;
}

export function sendMessage(chatId: number | string, html: string, extra: Record<string, unknown> = {}) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...extra,
  });
}

/** Resolve a file_id (e.g. a payment screenshot) to a downloadable URL. */
export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const file = await callTelegram<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!file.file_path) throw new TelegramError("Telegram did not return a file path.");
  return `${API_BASE}/file/bot${token()}/${file.file_path}`;
}

export function adminChatId(): number | null {
  const id = Number(process.env.ADMIN_CHAT_ID);
  return Number.isFinite(id) && id !== 0 ? id : null;
}
