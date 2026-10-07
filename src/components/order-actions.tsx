"use client";

import { useActionState, useState } from "react";
import { CircleCheck, CircleX, Ban } from "lucide-react";

import { decideOrder, messageCustomer, type ActionResult } from "@/app/actions";
import { SubmitButton } from "@/components/client-ui";
import { buttonClass, FormMessage, inputClass, labelClass } from "@/components/ui";
import type { OrderStatus } from "@/lib/format";

/** Approve / reject an order awaiting review, or cancel an unpaid one. */
export function OrderDecision({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(decideOrder, null);
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "awaiting_review") {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="orderId" value={orderId} />
        <p className="text-sm text-ink-2">
          Check the screenshot, send the diamonds in the game, then approve. The customer gets the same Telegram message
          as when you approve in the bot.
        </p>

        {!rejecting ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton name="decision" value="approve" pendingLabel="Approving" className="sm:flex-1">
              <CircleCheck aria-hidden className="size-4" />
              Approve, diamonds sent
            </SubmitButton>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className={buttonClass("danger-outline", "md", "sm:flex-1")}
            >
              <CircleX aria-hidden className="size-4" />
              Reject
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-line bg-subtle p-3 sm:p-4">
            <div>
              <label htmlFor="reason" className={labelClass}>
                Reason for the customer <span className="font-normal text-ink-2">(optional)</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="e.g. The amount was 5,000 MMK but we received 4,000 MMK."
                className={`${inputClass} h-auto py-2.5`}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRejecting(false)} className={buttonClass("ghost", "md")}>
                Keep order
              </button>
              <SubmitButton name="decision" value="reject" variant="danger" pendingLabel="Rejecting">
                <CircleX aria-hidden className="size-4" />
                Reject payment
              </SubmitButton>
            </div>
          </div>
        )}
        <FormMessage state={state} />
      </form>
    );
  }

  if (status === "pending_payment") {
    return (
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <p className="text-sm text-ink-2">
          The customer has not sent a payment screenshot yet. Cancel the order if they won&apos;t pay; it then stops
          counting towards their limit of 3 open orders.
        </p>
        {!cancelling ? (
          <button type="button" onClick={() => setCancelling(true)} className={buttonClass("danger-outline", "md")}>
            <Ban aria-hidden className="size-4" />
            Cancel order
          </button>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => setCancelling(false)} className={buttonClass("ghost", "md")}>
              Keep order
            </button>
            <SubmitButton name="decision" value="cancel" variant="danger" pendingLabel="Cancelling">
              <Ban aria-hidden className="size-4" />
              Yes, cancel order
            </SubmitButton>
          </div>
        )}
        <FormMessage state={state} />
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-2">This order is closed. No further action is needed.</p>
      <FormMessage state={state} />
    </div>
  );
}

/** Send the customer a message through the bot. */
export function MessageCustomerForm({ userId, orderId }: { userId: number; orderId?: string }) {
  // Controlled so a failed send keeps the text (React clears uncontrolled fields on submit).
  const [text, setText] = useState("");
  const [state, formAction] = useActionState<ActionResult, FormData>(async (prev, formData) => {
    const result = await messageCustomer(prev, formData);
    if (result?.ok) setText("");
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      {orderId && <input type="hidden" name="orderId" value={orderId} />}
      <div>
        <label htmlFor={`msg-${userId}`} className={labelClass}>
          Message
        </label>
        <textarea
          id={`msg-${userId}`}
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
          maxLength={2000}
          placeholder="Write in English or Burmese. It is sent from the bot."
          className={`${inputClass} h-auto py-2.5`}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormMessage state={state} />
        <SubmitButton variant="secondary" pendingLabel="Sending" className="ml-auto">
          Send message
        </SubmitButton>
      </div>
    </form>
  );
}
