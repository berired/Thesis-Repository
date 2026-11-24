"use client";

import { useActionState } from "react";
import { FormError, INPUT_CLASS } from "@/app/components/ui";
import { updateAccount, type AccountState } from "./actions";

const initialState: AccountState = {};
const CARD = "rounded-2xl border border-line bg-white p-5";

export default function AccountForm({
  name,
  email,
  phone,
  city,
}: {
  name: string;
  email: string;
  phone: string;
  city: string;
}) {
  const [state, formAction, pending] = useActionState(updateAccount, initialState);

  return (
    <form action={formAction} className="flex max-w-[640px] flex-col gap-4">
      <section className={`${CARD} flex flex-col gap-4`}>
        <h2 className="text-base font-semibold leading-6">Your details</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">Name</span>
          <input value={name} disabled readOnly className={`${INPUT_CLASS} !bg-[#f1f2f4]`} />
          <span className="text-[11px] text-muted">Your name can&apos;t be changed.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">Email</span>
          <input value={email} disabled readOnly className={`${INPUT_CLASS} !bg-[#f1f2f4]`} />
        </label>
      </section>

      <section className={`${CARD} flex flex-col gap-5`}>
        <div>
          <h2 className="text-base font-semibold leading-6">Contact details</h2>
          <p className="text-xs leading-[18px] text-muted">
            Never shown by default. You choose per animal, in its ID and QR tag tab, whether your
            first name, city, or text and call buttons appear when someone scans a lost animal&apos;s tag.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">Contact number</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={phone}
            placeholder="e.g. 0917 555 0123"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">City</span>
          <input
            name="city"
            maxLength={80}
            autoComplete="address-level2"
            defaultValue={city}
            placeholder="e.g. Quezon City"
            className={INPUT_CLASS}
          />
        </label>
      </section>

      <FormError message={state.error ?? null} />
      {state.saved ? (
        <p role="status" className="text-sm text-[#1f7a3d]">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-fit items-center rounded-xl bg-sky px-6 text-[15px] font-semibold text-white hover:bg-[#2d5aa8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
