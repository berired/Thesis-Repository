"use client";

import { useRef } from "react";
import Icon from "@/app/components/app-icon";
import InviteForm from "./invite-form";

/** "Invite caretaker" button on My animals: opens a dialog to pick an animal and enter an email. */
export default function InviteDialog({ pets }: { pets: { id: string; name: string }[] }) {
  const ref = useRef<HTMLDialogElement>(null);

  if (pets.length === 0) {
    return (
      <span
        aria-disabled="true"
        title="Add an animal first"
        className="flex h-9 shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-[#c3c9d1] bg-white px-4 text-[13px] font-semibold text-[#a0a7b0]"
      >
        <Icon name="users" size={14} />
        Invite caretaker
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#c3c9d1] bg-white px-4 text-[13px] font-semibold text-ink hover:bg-[#f6f8fa]"
      >
        <Icon name="users" size={14} />
        Invite caretaker
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-[20px] border-2 border-ink bg-white p-0 text-ink shadow-[8px_8px_0_var(--color-butter)] backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4 px-6 py-6">
          <h2 className="font-display text-[26px] leading-7 text-forest">Invite a caretaker</h2>
          <InviteForm pets={pets} />
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="h-10 w-fit rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold hover:bg-[#f6f8fa]"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
