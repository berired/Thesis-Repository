"use client";

import { useActionState, useState } from "react";
import { SPECIES } from "@/app/lib/pets";
import { registerPet, type RegisterPetState } from "./actions";
import QrStep from "./qr-step";

const initialState: RegisterPetState = {};
const input = "rounded border px-3 py-2";
const label = "flex flex-col gap-1 text-sm";

export default function PetForm({ initialCode }: { initialCode: string }) {
  const [state, formAction, pending] = useActionState(registerPet, initialState);
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState(initialCode);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="code" value={code} />

      {/* Step 1 stays mounted (hidden) so its values are submitted from step 2. */}
      <fieldset hidden={step !== 1} className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">1. Pet details</legend>

        <label className={label}>
          Name *
          <input name="name" required className={input} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Species *
            <select name="species" required defaultValue="" className={input}>
              <option value="" disabled>
                Select…
              </option>
              {SPECIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Breed
            <input name="breed" className={input} />
          </label>
          <label className={label}>
            Sex *
            <select name="sex" required defaultValue="" className={input}>
              <option value="" disabled>
                Select…
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label className={label}>
            Color *
            <input name="color" required className={input} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className={label}>
            Birth date *
            <input name="birthDate" type="date" required max={today} className={input} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="birthDateApproximate" type="checkbox" />
            I&apos;m estimating the age (pick an approximate date)
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Spayed / neutered
            <select name="neutered" defaultValue="" className={input}>
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className={label}>
            Weight (kg)
            <input name="weightKg" type="number" step="0.01" min="0" className={input} />
          </label>
        </div>

        <label className={label}>
          Microchip number
          <input name="microchip" className={input} />
        </label>
        <label className={label}>
          Markings
          <input name="markings" className={input} />
        </label>
        <label className={label}>
          Medical notes / allergies
          <textarea name="medicalNotes" rows={3} className={input} />
        </label>

        <button
          type="button"
          onClick={(e) => {
            if (e.currentTarget.form!.reportValidity()) setStep(2);
          }}
          className="self-start rounded bg-black px-4 py-2 text-white"
        >
          Next: scan QR
        </button>
      </fieldset>

      {step === 2 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-lg font-semibold">2. Scan the QR tag</legend>
          <QrStep value={code} onChange={setCode} />

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded border px-4 py-2"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending || !code.trim()}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {pending ? "Registering..." : "Register pet"}
            </button>
          </div>
        </fieldset>
      )}
    </form>
  );
}
