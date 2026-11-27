"use client";

import { BTN_DANGER } from "../ui";
import { deleteQrCode } from "./actions";

export default function DeleteButton({ id, code }: { id: string; code: string }) {
  return (
    <form
      action={deleteQrCode}
      onSubmit={(e) => {
        if (!confirm(`Delete QR code ${code}? Printed copies will stop working.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={BTN_DANGER}>Delete</button>
    </form>
  );
}
