"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/app/components/app-icon";
import { SECONDARY_BUTTON_CLASS } from "@/app/components/ui";
import {
  NFC_UNSUPPORTED,
  nfcAvailable,
  nfcErrorMessage,
  readTag,
  writeTag,
  type TagRead,
} from "@/app/lib/nfc";

/** Shared state for the two buttons: one NFC action at a time, cancellable, with a message. */
function useNfcAction() {
  const abort = useRef<AbortController | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  // Leaving the page cancels a tag read that is still waiting.
  useEffect(() => () => abort.current?.abort(), []);

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    // Checked when tapped, not when the page loads, so the page looks the same on every phone.
    if (!nfcAvailable()) {
      setMessage({ kind: "error", text: NFC_UNSUPPORTED });
      return;
    }
    setMessage(null);
    const controller = new AbortController();
    abort.current = controller;
    setWaiting(true);
    try {
      await action(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) setMessage({ kind: "error", text: nfcErrorMessage(error) });
    } finally {
      setWaiting(false);
      abort.current = null;
    }
  }

  return {
    waiting,
    message,
    setMessage,
    run,
    cancel: () => abort.current?.abort(),
  };
}

function Status({
  waiting,
  message,
  waitingText,
  cancel,
}: {
  waiting: boolean;
  message: { kind: "error" | "ok"; text: string } | null;
  waitingText: string;
  cancel: () => void;
}) {
  return (
    <>
      {waiting ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[#e6eefb] px-3 py-2 text-sm text-[#2a559e]">
          <span role="status">{waitingText}</span>
          <button type="button" onClick={cancel} className="font-semibold underline">
            Cancel
          </button>
        </div>
      ) : null}
      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm ${message.kind === "error" ? "text-[#c2372e]" : "text-[#1f7a3d]"}`}
        >
          {message.text}
        </p>
      ) : null}
    </>
  );
}

/** "Tap an NFC tag": waits for a tag and hands back the code it holds (and the chip's serial). */
export function NfcReadButton({
  onRead,
  label = "Tap an NFC tag",
}: {
  onRead: (tag: TagRead & { code: string }) => void;
  label?: string;
}) {
  const nfc = useNfcAction();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={nfc.waiting}
        onClick={() =>
          nfc.run(async (signal) => {
            const tag = await readTag(signal);
            if (!tag.code) {
              nfc.setMessage({ kind: "error", text: "That tag doesn't have a Pawket Book link on it." });
              return;
            }
            onRead({ ...tag, code: tag.code });
          })
        }
        className={`${SECONDARY_BUTTON_CLASS} !w-auto self-start`}
      >
        <Icon name="nfc" size={16} />
        {label}
      </button>
      <Status
        waiting={nfc.waiting}
        message={nfc.message}
        waitingText="Hold the tag against the back of your phone…"
        cancel={nfc.cancel}
      />
    </div>
  );
}

/** "Write to an NFC tag": puts the link on a tag so a tap opens the scan page, like the QR does. */
export function NfcWriteButton({
  url,
  allowLock = false,
  onWritten,
  label = "Write to an NFC tag",
}: {
  url: string;
  /** Offer a "lock for good" tick box (admin tags). The lock can't be undone. */
  allowLock?: boolean;
  /** Called with the chip's serial after a successful write, e.g. to remember it on the server. */
  onWritten?: (serial: string | null) => Promise<void> | void;
  label?: string;
}) {
  const nfc = useNfcAction();
  const [lock, setLock] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {allowLock ? (
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={lock}
            onChange={(e) => setLock(e.target.checked)}
            className="size-4 accent-[#356ac3]"
          />
          Lock the tag for good (it can never be rewritten)
        </label>
      ) : null}
      <button
        type="button"
        disabled={nfc.waiting}
        onClick={() =>
          nfc.run(async (signal) => {
            const { serial, locked } = await writeTag(url, { lock, signal });
            await onWritten?.(serial);
            nfc.setMessage({
              kind: "ok",
              text: `Written${locked ? " and locked" : ""}. Tapping this tag now opens the page.${
                lock && !locked ? " This browser couldn't lock it." : ""
              }`,
            });
          })
        }
        className={`${SECONDARY_BUTTON_CLASS} !w-auto self-start`}
      >
        <Icon name="nfc" size={16} />
        {label}
      </button>
      <Status
        waiting={nfc.waiting}
        message={nfc.message}
        waitingText="Hold a blank tag against the back of your phone and keep it there…"
        cancel={nfc.cancel}
      />
    </div>
  );
}
