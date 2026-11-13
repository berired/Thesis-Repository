"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import Icon from "@/app/components/icon";
import { FormError, INPUT_CLASS } from "@/app/components/ui";
import { registerPet, type RegisterPetState } from "./actions";
import QrStep from "./qr-step";

const initialState: RegisterPetState = {};

// Icons come from the sign-up chips; "Other" has no chip so it uses the paw.
const KINDS: { species: string; icon: string | null }[] = [
  { species: "Dog", icon: "/icons/chip-dog.svg" },
  { species: "Cat", icon: "/icons/chip-cat.svg" },
  { species: "Bird", icon: "/icons/chip-bird.svg" },
  { species: "Poultry", icon: "/icons/chip-egg.svg" },
  { species: "Reptile", icon: "/icons/chip-turtle.svg" },
  { species: "Fish", icon: "/icons/chip-fish.svg" },
  { species: "Rabbit", icon: "/icons/chip-rabbit.svg" },
  { species: "Other", icon: null },
];

const CARD = "rounded-2xl border border-line bg-white p-5";
const CARD_TITLE = "text-base font-semibold leading-6 text-ink";
const FIELD = `${INPUT_CLASS} !h-10 !rounded-lg !px-3 !text-sm`;

function Label({
  children,
  optional,
  required,
}: {
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <span className="text-xs font-medium leading-[18px] text-ink">
      {children}
      {required ? <span className="text-[#c2372e]"> *</span> : null}
      {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
    </span>
  );
}

export default function PetForm({ initialCode }: { initialCode: string }) {
  const [state, formAction, pending] = useActionState(registerPet, initialState);
  const [code, setCode] = useState(initialCode);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  return (
    <form action={formAction} className="flex min-w-0 flex-1 flex-col">
      <input type="hidden" name="code" value={code} />

      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-8">
        <Link
          href="/pets"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-sky hover:underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-left.svg" alt="" width={14} height={14} />
          My animals
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/pets"
            className="flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink hover:bg-[#f6f8fa]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex h-9 items-center rounded-lg bg-sky px-4 text-[13px] font-semibold text-white hover:bg-[#2d5aa8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save animal"}
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-5 px-8 py-7">
        <h1 className="font-display text-[44px] leading-[48px] text-forest">Add an animal</h1>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-4">
            <fieldset className={CARD}>
              <legend className="sr-only">What kind of animal?</legend>
              <h2 className={`${CARD_TITLE} mb-4`} aria-hidden="true">
                What kind of animal?
              </h2>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {KINDS.map(({ species, icon }, i) => (
                  <label key={species} className="cursor-pointer">
                    <input
                      type="radio"
                      name="species"
                      value={species}
                      required={i === 0}
                      className="peer sr-only"
                    />
                    <span className="flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white text-[11px] font-medium text-ink transition-colors hover:bg-[#f6f8fa] peer-checked:border-2 peer-checked:border-ink peer-checked:bg-butter peer-checked:font-semibold peer-checked:shadow-[2px_2px_0_var(--color-ink)] peer-focus-visible:ring-2 peer-focus-visible:ring-sky">
                      {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" width={18} height={18} />
                      ) : (
                        <Icon name="paw-print" size={18} />
                      )}
                      {species}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className={`${CARD} flex flex-col gap-4`}>
              <h2 className={CARD_TITLE}>About them</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <Label required>Name</Label>
                  <input name="name" required placeholder="e.g. Pepper" className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Breed or type</Label>
                  <input name="breed" placeholder="e.g. Bearded dragon" className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label required>Sex</Label>
                  <span className="relative">
                    <select
                      name="sex"
                      required
                      defaultValue=""
                      className={`${FIELD} appearance-none pr-9`}
                    >
                      <option value="" disabled>
                        Select…
                      </option>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                    </select>
                    <Icon
                      name="chevron-down"
                      size={16}
                      className="pointer-events-none absolute right-3 top-3 text-muted"
                    />
                  </span>
                </label>

                <div className="flex flex-col gap-1.5">
                  <label className="flex flex-col gap-1.5">
                    <Label required>Birthday</Label>
                    <input name="birthDate" type="date" required max={today} className={FIELD} />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted">
                    <input
                      name="birthDateApproximate"
                      type="checkbox"
                      className="size-3.5 accent-sky"
                    />
                    Approximate is fine
                  </label>
                </div>
                <label className="flex flex-col gap-1.5">
                  <Label optional>Weight</Label>
                  <span className="flex gap-2">
                    <input
                      name="weight"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="e.g. 412"
                      className={`${FIELD} min-w-0 flex-1`}
                    />
                    <span className="relative">
                      <select
                        name="weightUnit"
                        defaultValue="g"
                        aria-label="Weight unit"
                        className={`${FIELD} w-[72px] appearance-none pr-7`}
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                      </select>
                      <Icon
                        name="chevron-down"
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-3 text-muted"
                      />
                    </span>
                  </span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label optional>Microchip or tag no.</Label>
                  <input name="microchip" placeholder="e.g. 985 1120 0034" className={FIELD} />
                </label>

                <label className="flex flex-col gap-1.5">
                  <Label required>Color</Label>
                  <input name="color" required placeholder="e.g. Tan and brown" className={FIELD} />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <Label optional>Allergies or care notes</Label>
                <input
                  name="allergies"
                  placeholder="e.g. No citrus. Bask 40 °C."
                  className={FIELD}
                />
              </label>
            </section>

            <section className={`${CARD} flex flex-col gap-3`}>
              <div>
                <h2 className={CARD_TITLE}>
                  Pawket tag <span className="text-[#c2372e]">*</span>
                </h2>
                <p className="text-xs leading-[18px] text-muted">
                  Scan the QR on the tag that came with your animal to link it to this profile.
                </p>
              </div>
              <QrStep value={code} onChange={setCode} />
            </section>

            <FormError message={state.error ?? null} />
          </div>

          <aside className="flex flex-col gap-5">
            <div className="relative rounded-2xl border-2 border-ink bg-white px-5 pb-5 pt-10 shadow-[5px_5px_0_var(--color-butter)]">
              <span
                aria-hidden="true"
                className="absolute -top-3 left-1/2 h-[26px] w-[90px] -translate-x-1/2 rotate-[-1deg] bg-blush"
              />
              <label className="mx-auto flex size-[140px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-dashed border-[#9aa2ac] bg-[#f1f2f4] text-[13px] text-muted focus-within:ring-2 focus-within:ring-sky">
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPhotoError(null);
                    if (file && file.size > 5 * 1024 * 1024) {
                      e.target.value = "";
                      setPhotoUrl(null);
                      setPhotoError("Photo must be 5 MB or smaller.");
                      return;
                    }
                    setPhotoUrl(file ? URL.createObjectURL(file) : null);
                  }}
                />
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="Selected profile photo"
                    className="size-full object-cover"
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/image-placeholder.svg" alt="" width={24} height={24} />
                    Add a photo
                  </>
                )}
              </label>
              <div className="mt-4 text-center">
                <p className="text-[13px] font-semibold text-ink">Profile photo</p>
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  A clear face shot helps if they&apos;re ever lost.
                </p>
                {photoError ? (
                  <p role="alert" className="mt-1 text-[11px] text-[#c2372e]">
                    {photoError}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              aria-disabled="true"
              title="Coming soon"
              className="flex flex-col gap-3 rounded-2xl border border-[#cfe3f3] bg-[#e4f1fb] p-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-ink">Caretakers</h2>
                <p className="text-[11px] leading-4 text-muted">
                  People who can see records and tick off reminders.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="flex h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-[#c3c9d1] bg-white text-xs font-semibold text-[#a0a7b0]"
              >
                <Icon name="users" size={14} />
                Invite someone
              </button>
            </div>
          </aside>
        </div>
      </main>
    </form>
  );
}
