"use client";

import { NfcWriteButton } from "@/app/components/nfc-buttons";
import { recordNfcWrite } from "./actions";

/** Admin: writes this code's link onto a physical NFC tag and remembers which chip it was. */
export default function WriteNfc({ id, url }: { id: string; url: string }) {
  return (
    <NfcWriteButton
      url={url}
      allowLock
      label="Write to NFC tag"
      onWritten={async (serial) => {
        const result = await recordNfcWrite(id, serial);
        if (result?.error) throw new Error(result.error);
      }}
    />
  );
}
