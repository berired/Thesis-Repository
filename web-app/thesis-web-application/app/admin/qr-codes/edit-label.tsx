"use client";

import { useState } from "react";
import { updateQrLabel } from "./actions";

export default function EditLabel({ id, label }: { id: string; label: string | null }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        <span>{label ?? "-"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs underline"
          aria-label={`Edit label${label ? ` ${label}` : ""}`}
        >
          Edit
        </button>
      </span>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateQrLabel(formData);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false);
      }}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <input
        name="label"
        defaultValue={label ?? ""}
        maxLength={80}
        placeholder="No label"
        aria-label="Label"
        autoFocus
        className="w-36 rounded border px-2 py-1"
      />
      <button className="rounded border px-2 py-1">Save</button>
      <button type="button" onClick={() => setEditing(false)} className="px-1 text-xs underline">
        Cancel
      </button>
    </form>
  );
}
