"use client";

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
      <button className="rounded border px-2 py-1 text-red-700">Delete</button>
    </form>
  );
}
