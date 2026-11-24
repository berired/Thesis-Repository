"use client";

import { useState, useTransition } from "react";
import { FormError, INPUT_CLASS } from "@/app/components/ui";
import { inviteCaretaker } from "./actions";

/** An email box that invites a registered user to help with one animal. */
export default function InviteForm({
  pets,
  onSent,
}: {
  /** One entry fixes the animal; several show a chooser. */
  pets: { id: string; name: string }[];
  onSent?: () => void;
}) {
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      action={(fd) => {
        setError(null);
        setSent(null);
        start(async () => {
          const result = await inviteCaretaker(petId, String(fd.get("email") ?? ""));
          if ("error" in result) return setError(result.error);
          setSent(result.message);
          (document.getElementById("invite-email") as HTMLInputElement | null)?.form?.reset();
          onSent?.();
        });
      }}
    >
      {pets.length > 1 ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">Animal</span>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className={INPUT_CLASS}
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink">Their email</span>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="caretaker@example.com"
          className={INPUT_CLASS}
        />
        <span className="text-[11px] text-muted">
          They need a Pawket Book account. They can view records and tick off reminders you give
          them. They can&apos;t edit anything or see your contact details.
        </span>
      </label>
      <FormError message={error} />
      {sent ? (
        <p role="status" className="animate-rise text-sm text-[#1f7a3d]">
          {sent}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !petId}
        className="flex h-10 w-fit items-center rounded-xl bg-sky px-5 text-[15px] font-semibold text-white hover:bg-[#2d5aa8] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invitation"}
      </button>
    </form>
  );
}
