"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { codeFromText } from "@/app/lib/code";
import QrStep from "../pets/new/qr-step";

/** The scanner on /scan. A scanned or tapped tag opens straight away; a typed code needs "Open". */
export default function ScanTag() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = (raw: string) => {
    const valid = codeFromText(raw);
    if (!valid) {
      setError("That doesn't look like a Pawket Book tag code.");
      return;
    }
    router.push(`/r/${valid}`);
  };

  return (
    <div className="flex max-w-[560px] flex-col gap-4 rounded-xl border border-line bg-white p-5">
      <QrStep
        value={code}
        onChange={(next) => {
          setError(null);
          setCode(next);
        }}
        onDetected={open}
      />
      {error ? (
        <p role="alert" className="text-sm text-[#c2372e]">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => open(code)}
        disabled={!code.trim()}
        className="h-10 w-fit rounded-xl bg-sky px-5 text-[15px] font-semibold text-white hover:bg-[#2d5aa8] disabled:opacity-60"
      >
        Open
      </button>
    </div>
  );
}
