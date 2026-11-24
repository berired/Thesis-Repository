"use client";

import { useState, useTransition } from "react";
import Icon from "@/app/components/app-icon";
import { FormError } from "@/app/components/ui";
import { reportRecord } from "@/app/(owner)/records/actions";

/** Lets an owner flag a vet-submitted record to the admin. */
export default function ReportRecord({
  recordId,
  alreadyReported,
}: {
  recordId: string;
  alreadyReported: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(alreadyReported);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <Icon name="circle-check" size={15} />
        You reported this record. The admin will review it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit text-[13px] font-medium text-[#b42318] underline"
      >
        Report a problem with this record
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      action={(fd) => {
        setError(null);
        start(async () => {
          const result = await reportRecord(recordId, String(fd.get("reason") ?? ""));
          if ("error" in result) setError(result.error);
          else setSent(true);
        });
      }}
    >
      <label htmlFor="report-reason" className="text-[13px] font-medium">
        What is wrong with this record?
      </label>
      <textarea
        id="report-reason"
        name="reason"
        rows={3}
        maxLength={500}
        required
        className="rounded-lg border border-[#c3c9d1] bg-white px-3 py-2 text-sm"
      />
      <FormError message={error} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-[#b42318] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-sky"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
