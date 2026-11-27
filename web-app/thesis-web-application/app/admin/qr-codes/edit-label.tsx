"use client";

import { useState } from "react";
import Icon from "@/app/components/app-icon";
import { BTN_OUTLINE, FIELD } from "../ui";
import { updateQrLabel } from "./actions";

export default function EditLabel({ id, label }: { id: string; label: string | null }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        <span className={label ? "" : "text-muted"}>{label ?? "-"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-[#f6f8fa] hover:text-ink"
          aria-label={`Edit label${label ? ` ${label}` : ""}`}
        >
          <Icon name="pencil" size={14} />
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
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="id" value={id} />
      <input
        name="label"
        defaultValue={label ?? ""}
        maxLength={80}
        placeholder="No label"
        aria-label="Label"
        autoFocus
        className={`${FIELD} !h-8 !w-36`}
      />
      <button className={`${BTN_OUTLINE} !px-2.5`}>Save</button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="px-1 text-xs font-medium text-muted hover:text-ink"
      >
        Cancel
      </button>
    </form>
  );
}
