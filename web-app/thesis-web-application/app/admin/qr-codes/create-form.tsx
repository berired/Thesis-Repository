"use client";

import { useActionState } from "react";
import { BTN_PRIMARY, CARD, FIELD } from "../ui";
import { createQrCodes, type CreateQrState } from "./actions";

const initialState: CreateQrState = {};

export default function CreateQrForm() {
  const [state, formAction, pending] = useActionState(createQrCodes, initialState);

  return (
    <form action={formAction} className={`${CARD} flex flex-wrap items-end gap-4 p-5`}>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
        How many
        <input
          name="count"
          type="number"
          min={1}
          max={100}
          defaultValue={10}
          required
          className={`${FIELD} !w-28`}
        />
      </label>

      <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium text-ink sm:max-w-80">
        Batch label (optional)
        <input
          name="batch"
          type="text"
          placeholder="e.g. Nov 2026 print run"
          className={FIELD}
        />
      </label>

      <button type="submit" disabled={pending} className={`${BTN_PRIMARY} !h-9 !px-5`}>
        {pending ? "Generating..." : "Generate"}
      </button>

      {state.error && (
        <p role="alert" className="animate-shake text-sm text-[#c2372e]">
          {state.error}
        </p>
      )}
      {state.created && (
        <p className="animate-rise text-sm text-[#1f7a3d]">Created {state.created} QR codes.</p>
      )}
    </form>
  );
}
