"use client";

import { useActionState } from "react";
import type { ModerationState } from "./actions";

/** A reason box and one button, for voiding a record or dismissing a report. */
export default function ModerationForm({
  action,
  label,
  pendingLabel,
  placeholder,
  required,
  danger,
  confirm,
}: {
  action: (prev: ModerationState, fd: FormData) => Promise<ModerationState>;
  label: string;
  pendingLabel: string;
  placeholder: string;
  required: boolean;
  danger?: boolean;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  if (state?.done) return <p className="text-sm text-green-700">{state.done}</p>;
  return (
    <form
      action={formAction}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <textarea
        name="reason"
        rows={2}
        maxLength={500}
        required={required}
        placeholder={placeholder}
        aria-label={placeholder}
        className="rounded border px-3 py-2 text-sm"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`w-fit rounded px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${
          danger ? "bg-red-700" : "bg-gray-800"
        }`}
      >
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
