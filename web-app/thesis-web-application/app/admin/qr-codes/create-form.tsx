"use client";

import { useActionState } from "react";
import { createQrCodes, type CreateQrState } from "./actions";

const initialState: CreateQrState = {};

export default function CreateQrForm() {
  const [state, formAction, pending] = useActionState(createQrCodes, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">
        How many
        <input
          name="count"
          type="number"
          min={1}
          max={100}
          defaultValue={10}
          required
          className="w-28 rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Batch label (optional)
        <input
          name="batch"
          type="text"
          placeholder="e.g. Nov 2026 print run"
          className="w-64 rounded border px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Generating..." : "Generate"}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.created && (
        <p className="text-sm text-green-700">Created {state.created} QR codes.</p>
      )}
    </form>
  );
}
