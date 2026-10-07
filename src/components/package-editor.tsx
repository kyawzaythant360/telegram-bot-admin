"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import {
  createPackage,
  removePackage,
  reorderPackage,
  savePackage,
  type ActionResult,
} from "@/app/actions";
import { SubmitButton } from "@/components/client-ui";
import { buttonClass, FormMessage, inputClass, labelClass } from "@/components/ui";
import { LABEL_MAX } from "@/lib/format";
import type { Package } from "@/lib/queries";

export function PackageRow({ pkg, isFirst, isLast }: { pkg: Package; isFirst: boolean; isLast: boolean }) {
  const [saveState, saveAction] = useActionState<ActionResult, FormData>(savePackage, null);
  const [deleteState, deleteAction] = useActionState<ActionResult, FormData>(removePackage, null);
  const [label, setLabel] = useState(pkg.label);
  const [price, setPrice] = useState(String(pkg.price));
  const [confirmDelete, setConfirmDelete] = useState(false);
  // When the saved values change (after Save, or an edit from Telegram), show them.
  const [synced, setSynced] = useState({ label: pkg.label, price: pkg.price });
  if (synced.label !== pkg.label || synced.price !== pkg.price) {
    setSynced({ label: pkg.label, price: pkg.price });
    setLabel(pkg.label);
    setPrice(String(pkg.price));
  }
  const dirty = label !== pkg.label || price !== String(pkg.price);
  const invalid = saveState !== null && !saveState.ok;
  const id = `pkg-${pkg.key}`;

  return (
    <li className="px-4 py-4 sm:px-5">
      {/* Phone: name / price + Save / reorder + delete. Wide screens: one row. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <form
          action={saveAction}
          className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 gap-y-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
        >
          <input type="hidden" name="key" value={pkg.key} />
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor={`${id}-label`} className={labelClass}>
              Name
            </label>
            <input
              id={`${id}-label`}
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={LABEL_MAX}
              required
              aria-invalid={invalid || undefined}
              className={inputClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor={`${id}-price`} className={labelClass}>
              Price (MMK)
            </label>
            <input
              id={`${id}-price`}
              name="price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              aria-invalid={invalid || undefined}
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <SubmitButton variant="primary" pendingLabel="Saving" disabled={!dirty} className="min-w-20">
            Save
          </SubmitButton>
        </form>

        <div className="flex items-center justify-between gap-2 lg:justify-start">
          <form action={reorderPackage} className="flex gap-1">
            <input type="hidden" name="key" value={pkg.key} />
            <SubmitButton variant="ghost" size="sm" name="direction" value="up" disabled={isFirst} className="size-11 px-0">
              <ArrowUp aria-hidden className="size-4" />
              <span className="sr-only">Move {pkg.label} up</span>
            </SubmitButton>
            <SubmitButton variant="ghost" size="sm" name="direction" value="down" disabled={isLast} className="size-11 px-0">
              <ArrowDown aria-hidden className="size-4" />
              <span className="sr-only">Move {pkg.label} down</span>
            </SubmitButton>
          </form>

          {/* Delete is two-step: the first tap only asks for confirmation. */}
          <form action={deleteAction} className="flex gap-2">
            <input type="hidden" name="key" value={pkg.key} />
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={buttonClass("danger-ghost", "md", "lg:w-11 lg:px-0")}
              >
                <Trash2 aria-hidden className="size-4" />
                <span className="lg:sr-only">Delete</span>
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setConfirmDelete(false)} className={buttonClass("ghost", "md")}>
                  Keep
                </button>
                <SubmitButton variant="danger" pendingLabel="Deleting">
                  <Trash2 aria-hidden className="size-4" />
                  Delete
                </SubmitButton>
              </>
            )}
          </form>
        </div>
      </div>
      <div className="mt-2 empty:hidden">
        <FormMessage state={deleteState ?? saveState} />
      </div>
    </li>
  );
}

export function AddPackageForm() {
  // Controlled inputs: React clears uncontrolled fields after every submit,
  // which would wipe what the admin typed when the price is invalid.
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [state, formAction] = useActionState<ActionResult, FormData>(async (prev, formData) => {
    const result = await createPackage(prev, formData);
    if (result?.ok) {
      setLabel("");
      setPrice("");
    }
    return result;
  }, null);
  const invalid = state !== null && !state.ok;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="new-label" className={labelClass}>
            Name
          </label>
          <input
            id="new-label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            maxLength={LABEL_MAX}
            placeholder="e.g. 1412 Diamonds or Twilight Pass"
            aria-invalid={invalid || undefined}
            className={inputClass}
          />
        </div>
        <div className="sm:w-44">
          <label htmlFor="new-price" className={labelClass}>
            Price (MMK)
          </label>
          <input
            id="new-price"
            name="price"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="82000"
            aria-invalid={invalid || undefined}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <SubmitButton pendingLabel="Adding">
          <Plus aria-hidden className="size-4" />
          Add package
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
