"use client";

import Link from "next/link";
import Switch from "@/app/components/switch";
import { setLostMode } from "@/app/(owner)/actions";

export default function LostModeToggle({
  petId,
  petName,
  lost,
}: {
  petId: string;
  petName: string;
  lost: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <form action={setLostMode.bind(null, petId)}>
        <Switch
          name="lost"
          label="Lost mode"
          defaultChecked={lost}
          onTrackClass="peer-checked:bg-[#c2372e]"
          labelClassName="text-white"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </form>
      <p className="text-xs text-white/80">
        {lost
          ? `Anyone scanning ${petName}'s tag sees that they're lost, plus the contact details you allow in `
          : "Turn on if they go missing. Scanners then see the contact details you allow in "}
        <Link href="/account" className="font-semibold underline">
          My details
        </Link>
        .
      </p>
    </div>
  );
}
