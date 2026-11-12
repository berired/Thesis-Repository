"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError, PRIMARY_BUTTON_CLASS } from "@/app/components/ui";

type State = { error?: string } | undefined;

/** A form whose server action can hand back an error message to show above the buttons. */
export default function FormWithError({
  action,
  submitLabel,
  pendingLabel,
  cancelHref,
  children,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {children}
      <FormError message={state?.error ?? null} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`${PRIMARY_BUTTON_CLASS} !w-auto`}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="text-[15px] font-medium text-sky">
          Cancel
        </Link>
      </div>
    </form>
  );
}
