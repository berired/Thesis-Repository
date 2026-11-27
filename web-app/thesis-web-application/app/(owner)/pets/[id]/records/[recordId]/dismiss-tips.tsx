"use client";

import { useTransition } from "react";
import { dismissCareTips } from "@/app/(owner)/records/actions";

/** Hides the care tips card for this record. */
export default function DismissTips({ recordId }: { recordId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await dismissCareTips(recordId)))}
      className="h-8 w-fit rounded-lg px-2 text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-60"
    >
      {pending ? "Hiding…" : "Hide these tips"}
    </button>
  );
}
