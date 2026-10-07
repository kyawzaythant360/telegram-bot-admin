import type { NextRequest } from "next/server";

import { getOrder } from "@/lib/queries";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getFileDownloadUrl } from "@/lib/telegram";

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

/** Telegram's file server often says application/octet-stream; trust the extension instead. */
function imageType(url: string, header: string | null): string {
  if (header?.startsWith("image/")) return header;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_TYPES[ext] ?? "image/jpeg";
}

/** Streams an order's payment screenshot from Telegram (admin only). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/screenshot/[orderId]">) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { orderId } = await ctx.params;
  const order = await getOrder(decodeURIComponent(orderId));
  if (!order?.screenshot_file_id) return new Response("Not found", { status: 404 });

  try {
    const url = await getFileDownloadUrl(order.screenshot_file_id);
    const file = await fetch(url, { cache: "no-store" });
    if (!file.ok || !file.body) return new Response("Screenshot unavailable", { status: 502 });
    return new Response(file.body, {
      headers: {
        "Content-Type": imageType(url, file.headers.get("content-type")),
        // Private: only this browser may cache it, for an hour.
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Screenshot unavailable", { status: 502 });
  }
}
