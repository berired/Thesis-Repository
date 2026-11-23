"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/app/components/app-icon";
import { Field, FormError, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/components/ui";
import { createRecord, deleteRecord, updateRecord } from "@/app/(owner)/records/actions";
import { DOCUMENT_ACCEPT, MAX_FILES_PER_RECORD, checkUpload } from "@/app/lib/file-rules";
import { RECORD_TYPE_OPTIONS } from "@/app/lib/records";
import { documentTypeFor, formatBytes, uploadRecordFile } from "@/app/lib/upload-client";

export type RecordFormPet = { id: string; name: string };
export type RecordFormFile = { id: string; fileName: string; sizeBytes: number };
export type RecordFormValues = {
  type: string;
  title: string;
  recordDate: string;
  weightKg: string;
  clinic: string;
  notes: string;
  dose: string;
  batchNumber: string;
  endDate: string;
  nextDueDate: string;
  /** "HH:mm" dose times of the reminders linked to this medication record. */
  doseTimes: string[];
};

const EMPTY: RecordFormValues = {
  type: "VACCINATION",
  title: "",
  recordDate: "",
  weightKg: "",
  clinic: "",
  notes: "",
  dose: "",
  batchNumber: "",
  endDate: "",
  nextDueDate: "",
  doseTimes: [],
};

type Item = {
  key: number;
  file: File;
  status: "ready" | "uploading" | "done" | "failed";
  percent: number;
  error?: string;
};

const TYPE_ICON: Record<string, "syringe" | "pill" | "stethoscope" | "flask-conical" | "weight" | "file-text"> = {
  VACCINATION: "syringe",
  MEDICATION: "pill",
  VET_VISIT: "stethoscope",
  LAB_RESULT: "flask-conical",
  WEIGHT: "weight",
  OTHER: "file-text",
};

/**
 * One form for adding and editing an owner-made health record, with its attachments.
 * The Phase 4 vet form reuses this component.
 */
export default function RecordForm({
  pets,
  defaultPetId,
  today,
  recordId,
  initial,
  existingFiles = [],
}: {
  pets: RecordFormPet[];
  defaultPetId: string;
  today: string;
  recordId?: string;
  initial?: RecordFormValues;
  existingFiles?: RecordFormFile[];
}) {
  const router = useRouter();
  const editing = recordId !== undefined;
  const values = initial ?? { ...EMPTY, recordDate: today };

  const [type, setType] = useState(values.type);
  const [remindDoses, setRemindDoses] = useState(values.doseTimes.length > 0);
  const [doseTimes, setDoseTimes] = useState(
    values.doseTimes.length > 0 ? values.doseTimes : ["08:00"],
  );
  const [petId, setPetId] = useState(defaultPetId);
  const [items, setItems] = useState<Item[]>([]);
  const [saved, setSaved] = useState(existingFiles);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // After the record itself is saved, a retry must only upload the files that failed.
  const [savedId, setSavedId] = useState<{ petId: string; recordId: string } | null>(null);
  const nextKey = useRef(0);
  const [dragging, setDragging] = useState(false);

  const medication = type === "MEDICATION";
  const vaccine = type === "VACCINATION";
  const weight = type === "WEIGHT";
  const slotsLeft = MAX_FILES_PER_RECORD - saved.length - items.length;
  const leaveHref = `/pets/${petId}/records`;

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setItems((current) => {
      let room = MAX_FILES_PER_RECORD - saved.length - current.length;
      const added: Item[] = [];
      for (const file of incoming) {
        const check = checkUpload("document", file.type, file.size);
        if (!check.ok) {
          added.push({ key: nextKey.current++, file, status: "failed", percent: 0, error: check.error });
        } else if (room > 0) {
          room -= 1;
          added.push({ key: nextKey.current++, file, status: "ready", percent: 0 });
        } else {
          added.push({
            key: nextKey.current++,
            file,
            status: "failed",
            percent: 0,
            error: `A record can have at most ${MAX_FILES_PER_RECORD} files.`,
          });
        }
      }
      return [...current, ...added];
    });
  }

  const patch = (key: number, change: Partial<Item>) =>
    setItems((current) => current.map((i) => (i.key === key ? { ...i, ...change } : i)));

  async function removeSaved(docId: string) {
    const res = await fetch(`/api/pets/${petId}/documents/${docId}`, { method: "DELETE" });
    if (res.ok) setSaved((current) => current.filter((f) => f.id !== docId));
    else setError("Couldn't remove that file.");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const rejected = items.some((i) => i.status === "failed" && i.error && !savedId);
    if (rejected) {
      setError("Remove the files that can't be attached, then save again.");
      return;
    }

    setBusy(true);
    let target = savedId;
    if (!target) {
      const fd = new FormData(e.currentTarget);
      fd.set("type", type);
      fd.set("petId", petId);
      const result = recordId ? await updateRecord(recordId, fd) : await createRecord(fd);
      if ("error" in result) {
        setError(result.error);
        setBusy(false);
        return;
      }
      target = { petId: result.petId, recordId: result.recordId };
      setSavedId(target);
    }

    let failed = 0;
    for (const item of items) {
      if (item.status === "done") continue;
      patch(item.key, { status: "uploading", percent: 0, error: undefined });
      const res = await uploadRecordFile(
        target.petId,
        target.recordId,
        item.file,
        documentTypeFor(type),
        (percent) => patch(item.key, { percent }),
      );
      if (res.ok) patch(item.key, { status: "done", percent: 100 });
      else {
        failed += 1;
        patch(item.key, { status: "failed", error: res.error });
      }
    }

    setBusy(false);
    if (failed === 0) {
      router.push(`/pets/${target.petId}/records`);
      router.refresh();
    } else {
      setError(
        `The record is saved, but ${failed} ${failed === 1 ? "file" : "files"} didn't upload. Retry, or continue and add them later.`,
      );
    }
  }

  async function onDelete() {
    if (!recordId) return;
    if (!window.confirm("Delete this record and its attachments? This can't be undone.")) return;
    setBusy(true);
    const result = await deleteRecord(recordId);
    if ("error" in result) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/pets/${result.petId}/records`);
    router.refresh();
  }

  const titleLabel = vaccine ? "Vaccine" : medication ? "Medication name" : "Record name";
  const titleHint = vaccine
    ? "e.g. 5-in-1 (DHPPi+L)"
    : medication
      ? "e.g. Amoxicillin"
      : "e.g. Skin irritation check, Fecal test";

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="flex flex-col gap-5">
        <div
          role="tablist"
          aria-label="Record type"
          className="flex gap-1 overflow-x-auto rounded-xl bg-[#e9edf1] p-1"
        >
          {RECORD_TYPE_OPTIONS.map(([value, label]) => {
            const selected = value === type;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setType(value)}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium ${
                  selected ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name={TYPE_ICON[value]} size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Animal">
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                disabled={editing}
                className={INPUT_CLASS}
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
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
                  defaultValue={values.weightKg}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : (
              <Field label={titleLabel} hint={titleHint}>
                <input
                  name="title"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={values.title}
                  className={INPUT_CLASS}
                />
              </Field>
            )}

            {medication ? (
              <Field label="Dose" hint="Write it as on the label">
                <input
                  name="dose"
                  type="text"
                  maxLength={120}
                  placeholder="50 mg, twice daily"
                  defaultValue={values.dose}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : null}
            <Field label={medication ? "Prescribed by (optional)" : "Clinic (optional)"}>
              <input
                name="clinic"
                type="text"
                maxLength={120}
                defaultValue={values.clinic}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label={medication ? "Start date" : vaccine ? "Date given" : "Date"}>
              <input
                name="recordDate"
                type="date"
                required
                max={today}
                defaultValue={values.recordDate}
                className={INPUT_CLASS}
              />
            </Field>
            {medication ? (
              <Field label="End date (optional)">
                <input name="endDate" type="date" defaultValue={values.endDate} className={INPUT_CLASS} />
              </Field>
            ) : null}
            {medication ? (
              <div className="flex flex-col gap-3 rounded-lg bg-cream p-3.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="remindDoses"
                    checked={remindDoses}
                    onChange={(e) => setRemindDoses(e.target.checked)}
                    className="size-4 accent-[#356ac3]"
                  />
                  Remind me at each dose
                </label>
                {remindDoses ? (
                  <>
                    <p className="text-[13px] text-muted">
                      Daily reminders at these times, until the end date.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {doseTimes.map((time, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <input
                            name="doseTime"
                            type="time"
                            required
                            value={time}
                            aria-label={`Dose time ${index + 1}`}
                            onChange={(e) =>
                              setDoseTimes((current) =>
                                current.map((t, i) => (i === index ? e.target.value : t)),
                              )
                            }
                            className={`${INPUT_CLASS} w-[130px]`}
                          />
                          {doseTimes.length > 1 ? (
                            <button
                              type="button"
                              aria-label={`Remove dose time ${index + 1}`}
                              onClick={() =>
                                setDoseTimes((current) => current.filter((_, i) => i !== index))
                              }
                              className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-white"
                            >
                              <Icon name="circle-x" size={16} />
                            </button>
                          ) : null}
                        </span>
                      ))}
                      {doseTimes.length < 6 ? (
                        <button
                          type="button"
                          onClick={() => setDoseTimes((current) => [...current, "20:00"])}
                          className="text-sm font-semibold text-sky"
                        >
                          + Add a time
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            {vaccine ? (
              <>
                <Field label="Batch / lot no. (optional)">
                  <input
                    name="batchNumber"
                    type="text"
                    maxLength={60}
                    defaultValue={values.batchNumber}
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Next dose due (optional)">
                  <input
                    name="nextDueDate"
                    type="date"
                    defaultValue={values.nextDueDate}
                    className={INPUT_CLASS}
                  />
                </Field>
              </>
            ) : null}
          </div>
        </div>

        <Field label="Notes (optional)">
          <textarea
            name="notes"
            rows={4}
            maxLength={1000}
            defaultValue={values.notes}
            className={`${INPUT_CLASS} h-auto py-2.5`}
          />
        </Field>

        <FormError message={error} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON_CLASS} !w-auto`}>
            {busy
              ? "Saving..."
              : savedId
                ? "Retry uploads"
                : editing
                  ? "Save changes"
                  : "Save record"}
          </button>
          <Link
            href={savedId ? `/pets/${savedId.petId}/records` : leaveHref}
            className="text-[15px] font-medium text-sky"
          >
            {savedId ? "Continue without them" : "Cancel"}
          </Link>
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <section className="relative rounded-xl border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-butter)]">
          <span className="absolute -top-3 left-1/2 h-[22px] w-[84px] -translate-x-1/2 rotate-[-3deg] bg-powder" />
          <h2 className="mb-3 text-lg font-semibold leading-6">Attachments</h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center ${
              dragging ? "border-sky bg-[#eef3fb]" : "border-[#c3c9d1] bg-[#f6f8fa]"
            }`}
          >
            <Icon name="upload" size={22} className="text-muted" />
            <p className="text-sm text-ink">
              Drop files or{" "}
              <label className="cursor-pointer font-medium text-sky underline">
                browse
                <input
                  type="file"
                  multiple
                  accept={DOCUMENT_ACCEPT}
                  className="sr-only"
                  disabled={busy || slotsLeft <= 0}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </p>
            <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f6f8fa]">
              <Icon name="camera" size={14} />
              Take a photo
              <input
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                className="sr-only"
                disabled={busy || slotsLeft <= 0}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-xs text-muted">
              PDF, JPG, PNG · up to 10 MB each · {Math.max(slotsLeft, 0)} of{" "}
              {MAX_FILES_PER_RECORD} left
            </p>
          </div>

          {saved.length + items.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {saved.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <Icon name="file-text" size={18} className="shrink-0 text-sky" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/pets/${petId}/documents/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-semibold text-ink hover:underline"
                    >
                      {f.fileName}
                    </a>
                    <p className="text-xs text-muted">{formatBytes(f.sizeBytes)} · uploaded</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${f.fileName}`}
                    onClick={() => removeSaved(f.id)}
                    disabled={busy}
                    className="text-muted hover:text-[#b42318]"
                  >
                    <Icon name="trash-2" size={16} />
                  </button>
                </li>
              ))}
              {items.map((item) => (
                <li key={item.key} className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <Icon
                      name={item.status === "failed" ? "circle-x" : "file-text"}
                      size={18}
                      className={`shrink-0 ${item.status === "failed" ? "text-[#b42318]" : "text-sky"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.file.name}</p>
                      <p
                        className={`text-xs ${item.status === "failed" ? "text-[#b42318]" : "text-muted"}`}
                      >
                        {item.status === "failed"
                          ? item.error
                          : item.status === "done"
                            ? "Uploaded"
                            : item.status === "uploading"
                              ? `${item.percent}%`
                              : `${formatBytes(item.file.size)} · ready`}
                      </p>
                    </div>
                    {item.status !== "uploading" && item.status !== "done" ? (
                      <button
                        type="button"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => setItems((c) => c.filter((i) => i.key !== item.key))}
                        disabled={busy}
                        className="text-muted hover:text-[#b42318]"
                      >
                        <Icon name="trash-2" size={16} />
                      </button>
                    ) : null}
                  </div>
                  {item.status === "uploading" || item.status === "done" ? (
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e6eefb]">
                      <div
                        className={`h-full ${item.status === "done" ? "bg-[#0f6b47]" : "bg-sky"}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {editing ? (
          <section className="flex flex-col gap-2 rounded-xl border border-[#f1b8b3] bg-white p-5">
            <h2 className="text-base font-semibold">Delete this record</h2>
            <p className="text-[13px] text-muted">Removes it and its attachments from this animal&apos;s history.</p>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#c4372c] text-sm font-semibold text-white hover:bg-[#a82f26] disabled:opacity-60"
            >
              <Icon name="trash-2" size={15} />
              Delete record
            </button>
          </section>
        ) : null}
      </aside>
    </form>
  );
}
