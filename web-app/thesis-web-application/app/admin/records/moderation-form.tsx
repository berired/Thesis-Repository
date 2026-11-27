"use client";

import { useActionState } from "react";
import { BTN_DANGER_SOLID, BTN_OUTLINE, TEXTAREA } from "../ui";
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
  if (state?.done) return <p className="animate-rise text-sm text-[#1f7a3d]">{state.done}</p>;
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
        className={TEXTAREA}
      />
      {state?.error ? (
        <p role="alert" className="animate-shake text-sm text-[#c2372e]">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`w-fit ${danger ? BTN_DANGER_SOLID : BTN_OUTLINE}`}
      >
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
