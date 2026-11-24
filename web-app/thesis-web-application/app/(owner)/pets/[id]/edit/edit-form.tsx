"use client";

import { todayInput } from "@/app/lib/time";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import Icon from "@/app/components/app-icon";
import { FormError, INPUT_CLASS } from "@/app/components/ui";
import { SPECIES } from "@/app/lib/pets";
import RemoveDialog from "../remove-dialog";
import { updatePet, type EditPetState } from "./actions";

type EditablePet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: "MALE" | "FEMALE";
  birthDate: string;
  weightKg: string;
  color: string;
  microchip: string;
  allergies: string;
  hasPhoto: boolean;
  /** Changes whenever the pet is saved, so a new photo isn't served from cache. */
  version: number;
  recordCount: number;
};

const FORM_ID = "edit-pet";
const CARD = "rounded-2xl border border-line bg-white p-5";
const CARD_TITLE = "text-base font-semibold leading-6 text-ink";
const FIELD = `${INPUT_CLASS} !h-10 !rounded-lg !px-3 !text-sm`;
const initialState: EditPetState = {};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative">
      <select {...props} form={FORM_ID} className={`${FIELD} appearance-none pr-9`}>
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3 top-3 text-muted"
      />
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium leading-[18px] text-ink">{children}</span>;
}

export default function EditPetForm({
  pet,
  ownerName,
  caretakers,
}: {
  pet: EditablePet;
  ownerName: string;
  /** The caretaker list and invite box, rendered on the server. */
  caretakers: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(updatePet.bind(null, pet.id), initialState);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const today = todayInput();

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const shownPhoto =
    photoUrl ?? (pet.hasPhoto && !removePhoto ? `/api/pets/${pet.id}/photo?v=${pet.version}` : null);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Fields and the save button elsewhere on the page attach to this form by id,
          which keeps the archive/delete dialog's own form out of it. */}
      <form id={FORM_ID} action={formAction} />

      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-8">
        <Link
          href={`/pets/${pet.id}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-sky hover:underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-left.svg" alt="" width={14} height={14} />
          {pet.name}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/pets/${pet.id}`}
            className="flex h-9 items-center rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink hover:bg-[#f6f8fa]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            disabled={pending}
            className="flex h-9 items-center rounded-lg bg-sky px-4 text-[13px] font-semibold text-white hover:bg-[#2d5aa8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-5 px-4 py-5 sm:px-8 sm:py-7">
        <h1 className="font-display text-[32px] leading-[36px] text-forest sm:text-[44px] sm:leading-[48px]">
          Edit {pet.name}&apos;s profile
        </h1>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-4">
            <section className={`${CARD} flex flex-col gap-4`}>
              <h2 className={CARD_TITLE}>Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <Label>Name</Label>
                  <input
                    form={FORM_ID}
                    name="name"
                    required
                    defaultValue={pet.name}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Species</Label>
                  <Select name="species" required defaultValue={pet.species}>
                    {SPECIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Breed</Label>
                  <input
                    form={FORM_ID}
                    name="breed"
                    defaultValue={pet.breed}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Sex</Label>
                  <Select name="sex" required defaultValue={pet.sex}>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </Select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Birthday</Label>
                  <input
                    form={FORM_ID}
                    name="birthDate"
                    type="date"
                    required
                    max={today}
                    defaultValue={pet.birthDate}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Weight (kg)</Label>
                  <input
                    form={FORM_ID}
                    name="weightKg"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    defaultValue={pet.weightKg}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Colour</Label>
                  <input
                    form={FORM_ID}
                    name="color"
                    required
                    defaultValue={pet.color}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Microchip</Label>
                  <input
                    form={FORM_ID}
                    name="microchip"
                    defaultValue={pet.microchip}
                    className={FIELD}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Allergies</Label>
                  <input
                    form={FORM_ID}
                    name="allergies"
                    defaultValue={pet.allergies}
                    className={FIELD}
                  />
                </label>
              </div>
              <FormError message={state.error ?? null} />
            </section>

            <section className={`${CARD} flex flex-col gap-3`}>
              <div>
                <h2 className={CARD_TITLE}>Caretakers</h2>
                <p className="text-xs leading-[18px] text-muted">
                  Caretakers can view records and complete reminders you give them. Only you can
                  edit or delete.
                </p>
              </div>
              <div className="flex items-center gap-3 py-1">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-butter-soft text-xs font-semibold text-butter-ink"
                >
                  {initials(ownerName)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                  {ownerName} (you)
                </span>
                <span className="rounded-md bg-[#e6eefb] px-2 py-0.5 text-xs font-semibold text-[#2a559e]">
                  Owner
                </span>
              </div>
              <div className="flex flex-col gap-4 border-t border-line pt-3">{caretakers}</div>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="rounded-2xl border-2 border-ink bg-white px-5 py-6 shadow-[5px_5px_0_var(--color-butter)]">
              <div className="flex flex-col items-center gap-4">
                <span className="flex size-[140px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#9aa2ac] bg-[#f1f2f4] text-[13px] text-muted">
                  {shownPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shownPhoto}
                      alt={`${pet.name}'s profile photo`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/icons/image-placeholder.svg" alt="" width={24} height={24} />
                      {pet.name}
                    </span>
                  )}
                </span>
                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#c3c9d1] bg-white px-3 text-xs font-semibold text-ink focus-within:ring-2 focus-within:ring-sky hover:bg-[#f6f8fa]">
                  <Icon name="camera" size={14} />
                  Change photo
                  <input
                    form={FORM_ID}
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
                      if (file) setRemovePhoto(false);
                    }}
                  />
                </label>
                {pet.hasPhoto && !photoUrl ? (
                  <>
                    <input
                      form={FORM_ID}
                      type="hidden"
                      name="removePhoto"
                      value={removePhoto ? "1" : "0"}
                    />
                    <button
                      type="button"
                      onClick={() => setRemovePhoto((v) => !v)}
                      className="text-xs font-semibold text-[#b42318] underline"
                    >
                      {removePhoto ? "Keep the photo" : "Remove photo"}
                    </button>
                  </>
                ) : null}
                {photoError ? (
                  <p role="alert" className="text-[11px] text-[#c2372e]">
                    {photoError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#f0c4c0] bg-white p-4">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Archive or delete</h2>
                <p className="mt-1 text-xs leading-[18px] text-muted">
                  Archive keeps {pet.name}&apos;s records but hides them from your lists.
                  Deleting removes everything.
                </p>
              </div>
              <RemoveDialog
                petId={pet.id}
                petName={pet.name}
                recordCount={pet.recordCount}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
