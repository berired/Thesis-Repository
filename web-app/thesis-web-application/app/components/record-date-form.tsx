"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/components/ui";
import { updateRecord } from "@/app/(owner)/records/actions";

/** A vet-submitted record: the owner can correct the visit date and nothing else. */
export default function RecordDateForm({
  recordId,
  petId,
  date,
  today,
}: {
  recordId: string;
  petId: string;
  date: string;
  today: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const result = await updateRecord(recordId, new FormData(e.currentTarget));
        if ("error" in result) {
          setError(result.error);
          setBusy(false);
          return;
        }
        router.push(`/pets/${petId}/records/${recordId}`);
        router.refresh();
      }}
      className="flex max-w-[420px] flex-col gap-4 rounded-xl border border-line bg-white p-5"
    >
      <p className="text-[13px] text-muted">
        This record was added by a vet, so only the visit date can be changed. You can add a note
        on the record page, or report the record if something is wrong.
      </p>
      <Field label="Visit date">
        <input name="recordDate" type="date" required max={today} defaultValue={date} className={INPUT_CLASS} />
      </Field>
      <FormError message={error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON_CLASS} !w-auto`}>
          {busy ? "Saving..." : "Save date"}
        </button>
        <Link href={`/pets/${petId}/records/${recordId}`} className="text-[15px] font-medium text-sky">
          Cancel
        </Link>
      </div>
    </form>
  );
}
