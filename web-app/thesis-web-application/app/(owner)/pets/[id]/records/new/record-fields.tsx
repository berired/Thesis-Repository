"use client";

import { useState } from "react";
import { Field, INPUT_CLASS } from "@/app/components/ui";

const TYPES = [
  ["VACCINE", "Vaccine"],
  ["WEIGHT", "Weight"],
  ["CHECKUP", "Check-up"],
  ["MEDICATION", "Medication"],
  ["LAB", "Lab result"],
] as const;

export default function RecordFields({ today }: { today: string }) {
  const [type, setType] = useState("VACCINE");
  const weight = type === "WEIGHT";

  return (
    <>
      <Field label="Type">
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={INPUT_CLASS}
        >
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      {weight ? (
        <Field label="Weight (kg)">
          <input
            name="weightKg"
            type="number"
            step="0.01"
            min="0"
            required
            className={INPUT_CLASS}
          />
        </Field>
      ) : (
        <Field label="Title" hint="e.g. 5-in-1 (DHPPi+L), Skin irritation check">
          <input name="title" type="text" required maxLength={120} className={INPUT_CLASS} />
        </Field>
      )}
      <Field label="Date">
        <input
          name="recordDate"
          type="date"
          required
          max={today}
          defaultValue={today}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Clinic (optional)">
        <input name="clinic" type="text" maxLength={120} className={INPUT_CLASS} />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          className={`${INPUT_CLASS} h-auto py-2.5`}
        />
      </Field>
    </>
  );
}
