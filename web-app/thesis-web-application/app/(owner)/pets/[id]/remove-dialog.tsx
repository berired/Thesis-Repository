"use client";

import { useActionState, useRef, useState } from "react";
import Icon from "@/app/components/icon";
import { FormError } from "@/app/components/ui";
import { removePet, type FormState } from "@/app/(owner)/actions";

export default function RemoveDialog({
  petId,
  petName,
  recordCount,
}: {
  petId: string;
  petName: string;
  recordCount: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"archive" | "delete">("archive");
  const [state, action, pending] = useActionState<FormState, FormData>(
    removePet.bind(null, petId),
    undefined,
  );
  const deleting = mode === "delete";

  const options = [
    {
      value: "archive" as const,
      title: `Archive ${petName}`,
      body: `Hide ${petName} from lists and stop reminders. Records stay, and you can restore ${petName} any time.`,
    },
    {
      value: "delete" as const,
      title: "Delete permanently",
      body: "Removes the profile, records, reminders and QR tag. This can't be undone.",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="self-start text-sm font-medium text-[#b42318] underline"
      >
        Remove {petName}
      </button>

      <dialog
        ref={ref}
        onClose={() => setMode("archive")}
        className="m-auto w-[min(510px,calc(100vw-32px))] rounded-[20px] border-2 border-ink bg-white p-0 text-ink shadow-[8px_8px_0_var(--color-blush)] backdrop:bg-black/40"
      >
        <form action={action} className="flex flex-col">
          <div className="flex flex-col gap-1 px-7 pb-5 pt-7">
            <h2 className="text-xl font-semibold leading-[26px]">
              Remove {petName} from your animals?
            </h2>
            <p className="text-[13px] leading-[19.5px] text-muted">
              Choose what happens to {petName}&apos;s {recordCount}{" "}
              {recordCount === 1 ? "record" : "records"}.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${
                    mode === option.value
                      ? "border-sky bg-[#eef3fb] ring-1 ring-sky"
                      : "border-line bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-1 size-4 accent-sky"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] leading-[22.5px]">{option.title}</span>
                    <span className="text-[13px] leading-[19.5px] text-muted">
                      {option.body}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <FormError message={state?.error ?? null} />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-line px-7 py-4">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="h-10 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold"
            >
              Keep {petName}
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`flex h-10 items-center gap-2 rounded-xl px-[18px] text-[15px] font-semibold text-white disabled:opacity-60 ${
                deleting ? "bg-[#b42318] hover:bg-[#9a1e14]" : "bg-sky hover:bg-[#2d5aa8]"
              }`}
            >
              <Icon name={deleting ? "trash-2" : "archive"} size={16} />
              {deleting ? `Delete ${petName}` : `Archive ${petName}`}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
