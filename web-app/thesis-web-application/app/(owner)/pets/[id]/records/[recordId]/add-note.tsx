"use client";

import { useRef, useState, useTransition } from "react";
import { FormError } from "@/app/components/ui";
import { addRecordNote } from "@/app/(owner)/records/actions";

/** A box for adding a note to a saved record. Notes can be added, never edited or removed. */
export default function AddNote({ recordId }: { recordId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      className="flex flex-col gap-2"
      action={(fd) => {
        setError(null);
        start(async () => {
          const result = await addRecordNote(recordId, String(fd.get("body") ?? ""));
          if ("error" in result) setError(result.error);
          else form.current?.reset();
        });
      }}
    >
      <label htmlFor="record-note" className="text-[13px] font-medium">
        Add a note
      </label>
      <textarea
        id="record-note"
        name="body"
        rows={3}
        maxLength={1000}
        required
        className="rounded-lg border border-[#c3c9d1] bg-white px-3 py-2 text-sm"
      />
      <FormError message={error} />
      <button
        type="submit"
        disabled={pending}
        className="h-9 w-fit rounded-lg bg-sky px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
