"use client";

import { useActionState } from "react";
import Switch from "@/app/components/switch";
import { FormError, INPUT_CLASS } from "@/app/components/ui";
import { updateAccount, type AccountState } from "./actions";

const initialState: AccountState = {};
const CARD = "rounded-2xl border border-line bg-white p-5";

export default function AccountForm({
  name,
  email,
  phone,
  address,
  showPhone,
  showAddress,
}: {
  name: string;
  email: string;
  phone: string;
  address: string;
  showPhone: boolean;
  showAddress: boolean;
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
            Only shown to people who scan a tag while one of your animals is in lost mode, and
            only if you switch it on.
          </p>
        </div>

        <div className="flex flex-col gap-3">
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
          <Switch
            name="showPhone"
            label="Show my number to the public"
            defaultChecked={showPhone}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink">Address</span>
            <textarea
              name="address"
              rows={3}
              maxLength={200}
              defaultValue={address}
              placeholder="Street, barangay, city"
              className={`${INPUT_CLASS} !h-auto py-2.5`}
            />
          </label>
          <Switch
            name="showAddress"
            label="Show my address to the public"
            defaultChecked={showAddress}
          />
        </div>
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
