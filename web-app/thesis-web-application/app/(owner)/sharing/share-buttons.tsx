"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leavePet, removeCaretaker, respondToInvite } from "./actions";

/** Accept and Decline for a pending invitation. */
export function InviteResponse({ shareId }: { shareId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const answer = (accept: boolean) =>
    start(async () => {
      const result = await respondToInvite(shareId, accept);
      if ("error" in result) setError(result.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => answer(true)}
          className="h-9 rounded-lg bg-sky px-4 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => answer(false)}
          className="h-9 rounded-lg border border-[#c3c9d1] bg-white px-4 text-[13px] font-semibold text-ink disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-[#c2372e]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Owner: remove a caretaker or withdraw an invitation. */
export function RemoveCaretaker({ shareId, name }: { shareId: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Remove ${name}? They lose access right away.`)) return;
          start(async () => {
            const result = await removeCaretaker(shareId);
            if ("error" in result) setError(result.error);
            router.refresh();
          });
        }}
        className="text-[13px] font-medium text-[#b42318] underline disabled:opacity-60"
      >
        Remove
      </button>
      {error ? <span className="text-xs text-[#c2372e]">{error}</span> : null}
    </span>
  );
}

/** Caretaker: stop helping with an animal. */
export function LeavePet({ petId, petName }: { petId: string; petName: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Stop helping with ${petName}? You'll need a new invitation to come back.`)) return;
        start(async () => {
          await leavePet(petId);
          router.push("/pets");
          router.refresh();
        });
      }}
      className="h-9 rounded-lg border border-[#c3c9d1] bg-white px-4 text-[13px] font-semibold text-[#b42318] disabled:opacity-60"
    >
      Stop helping with {petName}
    </button>
  );
}
