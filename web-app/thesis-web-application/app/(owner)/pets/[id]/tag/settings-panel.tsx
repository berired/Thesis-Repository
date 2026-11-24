"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Icon from "@/app/components/app-icon";
import ScanCard, { CALL_BUTTON, MESSAGE_BUTTON, SMS_BUTTON } from "@/app/components/scan-card";
import Switch from "@/app/components/switch";
import { FormError } from "@/app/components/ui";
import {
  MAX_PUBLIC_NOTE,
  SETTING_GROUPS,
  applySettings,
  type PublicSettings,
  type ScanSource,
} from "@/app/lib/scan-view";
import { savePublicSettings } from "./actions";

/** The "When someone scans it" switches next to a live preview of exactly what they would see. */
export default function SettingsPanel({
  petId,
  initial,
  source,
  species,
  memberNo,
  photoUrl,
  ownerHasCity,
  lost,
}: {
  petId: string;
  initial: PublicSettings;
  source: ScanSource;
  species: string;
  memberNo: string;
  photoUrl: string | null;
  ownerHasCity: boolean;
  lost: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const [state, action, pending] = useActionState(savePublicSettings.bind(null, petId), undefined);
  const view = applySettings(source, settings);

  const hints: Partial<Record<keyof PublicSettings, string>> = {
    showCity: ownerHasCity ? undefined : "Add your city in My details first.",
    allowCall: source.ownerHasPhone ? undefined : "Add your number in My details first.",
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={action} className="flex flex-col gap-5 rounded-xl border border-line bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold leading-6">When someone scans it</h2>
          <p className="text-[13px] text-muted">
            You choose what they see. Change it any time. Nothing is shown unless{" "}
            {source.petName} is in lost mode.
          </p>
        </div>

        {SETTING_GROUPS.map((group) => (
          <fieldset key={group.title} className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold">{group.title}</legend>
            {group.items.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <Switch
                  name={key}
                  label={label}
                  defaultChecked={settings[key]}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                />
                {settings[key] && hints[key] ? (
                  <span className="pl-16 text-[11px] text-muted">
                    {hints[key]}{" "}
                    <Link href="/account" className="font-semibold text-sky underline">
                      My details
                    </Link>
                  </span>
                ) : null}
              </div>
            ))}
            {group.title === "Vet health summary" ? (
              <input
                name="publicNote"
                value={settings.publicNote}
                maxLength={MAX_PUBLIC_NOTE}
                onChange={(e) => setSettings((s) => ({ ...s, publicNote: e.target.value }))}
                placeholder="e.g. Gentle with people"
                aria-label="Additional note for finders"
                className="h-11 rounded-xl border border-[#c3c9d1] bg-white px-3.5 text-sm placeholder:text-[#a0a7b0]"
              />
            ) : null}
          </fieldset>
        ))}

        <FormError message={state?.error ?? null} />
        {state?.saved ? (
          <p role="status" className="text-sm text-[#1f7a3d]">
            Saved.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-fit items-center rounded-xl bg-sky px-6 text-[15px] font-semibold text-white hover:bg-[#2d5aa8] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-muted">Scan page preview</p>
        {!lost ? (
          <p className="rounded-lg bg-[#fff6d1] px-3 py-2 text-xs text-[#7a5a00]">
            Lost mode is off, so right now a stranger sees nothing. This is what they would see once
            you turn it on.
          </p>
        ) : null}
        <ScanCard
          view={view}
          species={species}
          memberNo={memberNo}
          photoUrl={photoUrl}
          actions={
            <>
              {view.canCall ? (
                <>
                  <span className={SMS_BUTTON}>
                    <Icon name="message-square" size={18} />
                    Text my owner
                  </span>
                  <span className={CALL_BUTTON}>
                    <Icon name="phone" size={18} />
                    Call my owner
                  </span>
                </>
              ) : null}
              {view.canMessage ? (
                <span className={MESSAGE_BUTTON}>
                  <Icon name="message-circle" size={18} />
                  Message in app
                </span>
              ) : null}
              {!view.canCall && !view.canMessage ? (
                <p className="text-center text-[13px] text-muted">
                  No way to contact you is switched on.
                </p>
              ) : null}
            </>
          }
        />
      </div>
    </div>
  );
}
