"use client";

import { parseZoned } from "@/app/lib/time";

import Link from "next/link";
import { useActionState, useState } from "react";
import Icon from "@/app/components/app-icon";
import { Field, FormError, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/components/ui";
import { createReminder } from "@/app/(owner)/reminders/actions";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  REPEAT_LABEL,
  REPEAT_UNIT,
  fmtFull,
  fmtTime,
  repeatLabel,
  upcomingDates,
} from "@/app/lib/care";
import type { ReminderCategory, ReminderRepeat } from "@/app/generated/prisma/client";

const TYPE_ORDER: ReminderCategory[] = [
  "MEDICATION",
  "VACCINE",
  "FEEDING",
  "GROOMING",
  "EXERCISE",
  "HABITAT",
  "APPOINTMENT",
  "OTHER",
];
const REPEATS: ReminderRepeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

/** The New reminder form: what and who, when, and how to be told, with a live preview. */
export default function ReminderForm({
  pets,
  defaultPetId,
  today,
  next,
  caretakers = [],
}: {
  pets: { id: string; name: string }[];
  defaultPetId: string;
  today: string;
  next: string;
  /** Accepted caretakers of the owner's animals, so a reminder can be given to one of them. */
  caretakers?: { petId: string; userId: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createReminder, undefined);
  const [category, setCategory] = useState<ReminderCategory>("OTHER");
  const [petId, setPetId] = useState(defaultPetId);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [repeat, setRepeat] = useState<ReminderRepeat>("NONE");
  const [every, setEvery] = useState(1);
  const [endsAt, setEndsAt] = useState("");

  const petName = pets.find((p) => p.id === petId)?.name ?? "";
  const helpers = caretakers.filter((c) => c.petId === petId);
  const validStart = parseZoned(startDate, startTime || "09:00");
  const end = endsAt ? parseZoned(endsAt, "23:59") : null;
  const following = validStart
    ? upcomingDates(validStart, repeat, Math.max(1, every), end, 3)
    : [];

  return (
    <form action={action} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold leading-6">What and who</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type">
            {TYPE_ORDER.map((value) => {
              const selected = category === value;
              return (
                <label
                  key={value}
                  className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-all active:scale-95 ${
                    selected
                      ? "border-sky bg-[#eef3fb] text-[#2a559e]"
                      : "border-line bg-white text-ink hover:bg-[#f6f8fa]"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={selected}
                    onChange={() => setCategory(value)}
                    className="sr-only"
                  />
                  <Icon
                    key={String(selected)}
                    name={selected ? "check" : CATEGORY_ICON[value]}
                    size={14}
                    className={selected ? "animate-pop" : ""}
                  />
                  {CATEGORY_LABEL[value]}
                </label>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Animal">
              <select
                name="petId"
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className={INPUT_CLASS}
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            {helpers.length > 0 ? (
              <Field label="Who does it" hint="They get it in their reminders and notifications.">
                <select key={petId} name="assignee" defaultValue="me" className={INPUT_CLASS}>
                  <option value="me">Me</option>
                  {helpers.map((c) => (
                    <option key={c.userId} value={c.userId}>
                      {c.name}
                    </option>
                  ))}
                  <option value="anyone">Whoever gets to it first</option>
                </select>
              </Field>
            ) : null}
            <Field label="Title" hint="e.g. Deworming tablet, Change tank water">
              <input
                name="title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold leading-6">When</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <input
                name="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Time">
              <input
                name="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Repeats">
              <select
                name="repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as ReminderRepeat)}
                className={INPUT_CLASS}
              >
                {REPEATS.map((value) => (
                  <option key={value} value={value}>
                    {REPEAT_LABEL[value]}
                  </option>
                ))}
              </select>
            </Field>
            {repeat !== "NONE" ? (
              <Field label={`Every how many ${REPEAT_UNIT[repeat][1]}?`}>
                <input
                  name="repeatEvery"
                  type="number"
                  min={1}
                  max={365}
                  value={every}
                  onChange={(e) => setEvery(Number(e.target.value) || 1)}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : (
              <div />
            )}
            {repeat !== "NONE" ? (
              <Field label="Ends (optional)" hint="Leave empty to repeat until you delete it">
                <input
                  name="endsAt"
                  type="date"
                  min={startDate}
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : null}
            {category === "APPOINTMENT" ? (
              <Field label="Place (optional)">
                <input name="place" type="text" maxLength={120} className={INPUT_CLASS} />
              </Field>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold leading-6">Assign and notify</h2>
          <p className="flex items-center gap-2 text-sm">
            <Icon name="user" size={15} className="text-muted" />
            Assigned to you. You&apos;ll be notified in the app when it&apos;s due.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remindDayBefore" className="size-4 accent-[#356ac3]" />
            Remind me 1 day before
          </label>
          {category === "MEDICATION" || category === "VACCINE" || category === "APPOINTMENT" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="addToRecords" className="size-4 accent-[#356ac3]" />
              Also add to health records when done
            </label>
          ) : null}
        </section>

        <FormError message={state?.error ?? null} />
        <div className="flex gap-3">
          <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} w-auto px-6`}>
            {pending ? "Saving..." : "Save reminder"}
          </button>
          <Link
            href={next}
            className="flex h-11 items-center rounded-lg border border-[#c3c9d1] bg-white px-5 text-sm font-semibold text-ink hover:bg-[#f6f8fa]"
          >
            Cancel
          </Link>
        </div>
      </div>

      <aside className="flex flex-col gap-2 lg:sticky lg:top-6">
        <p className="text-[13px] text-muted">Preview</p>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef3fb] text-sky">
            <Icon name={CATEGORY_ICON[category]} size={18} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="break-words text-[15px] font-semibold">{title || "Untitled reminder"}</p>
            <p className="text-[13px] text-muted">
              {petName}
              {validStart ? ` · ${fmtFull(validStart)}, ${fmtTime(validStart)}` : ""}
            </p>
            {repeat !== "NONE" ? (
              <p className="flex items-center gap-1 text-[13px] text-muted">
                <Icon name="repeat" size={12} />
                {repeatLabel(repeat, Math.max(1, every))}
              </p>
            ) : null}
          </div>
        </div>
        {following.length > 0 ? (
          <p className="text-[13px] text-muted">
            Next ones: {following.map((d) => fmtFull(d)).join(", ")}.
          </p>
        ) : null}
      </aside>
    </form>
  );
}
