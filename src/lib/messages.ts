import "server-only";

// Customer-facing Telegram messages. These are copied word for word from the
// bot's texts.py (order_approved, order_rejected, message_from_shop) so a
// customer gets the same message whether you decide in Telegram or here.
// If you change the wording in the bot, change it here too.

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const shopName = () => process.env.SHOP_NAME || "MLBB Diamond Shop";
const supportContact = () => process.env.SUPPORT_CONTACT || process.env.PAYMENT_PHONE || "";

export function orderApproved(orderId: string): string {
  return (
    `🎉 Your diamonds have been sent! 💎\nOrder: <code>${esc(orderId)}</code>\n\n` +
    "🎉 သင့် Diamond များ ပို့ပြီးပါပြီ! 💎 ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါတယ်။"
  );
}

export function orderRejected(orderId: string): string {
  const contact = esc(supportContact());
  return (
    `❌ We could not verify the payment for order <code>${esc(orderId)}</code>.\n` +
    "Common reasons: wrong amount, unclear or wrong screenshot, or payment not received.\n" +
    `Please reply here with the reason/details or contact us: <b>${contact}</b>\n\n` +
    `❌ အော်ဒါ <code>${esc(orderId)}</code> ၏ ငွေပေးချေမှုကို အတည်မပြုနိုင်ပါ။\n` +
    "ဖြစ်နိုင်သော အကြောင်းရင်းများ — ငွေပမာဏ မှားခြင်း၊ screenshot မရှင်းလင်းခြင်း/မှားခြင်း၊ " +
    "ငွေမရောက်ခြင်း။\n" +
    `အသေးစိတ်အတွက် ဆက်သွယ်ရန်: <b>${contact}</b>`
  );
}

export function messageFromShop(text: string, orderId?: string): string {
  const about = orderId ? ` about <code>${esc(orderId)}</code>` : "";
  return `📩 <b>Message from ${esc(shopName())}</b>${about}:\n\n${esc(text)}`;
}

/** Note posted in the admin's Telegram chat when an order is decided on the web. */
export function adminWebDecision(orderId: string, approved: boolean): string {
  return `${approved ? "✅ APPROVED" : "❌ REJECTED"} from the web panel: <code>${esc(orderId)}</code>`;
}
