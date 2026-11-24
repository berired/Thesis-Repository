"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/app/components/app-icon";
import { NfcReadButton } from "@/app/components/nfc-buttons";
import { INPUT_CLASS, SECONDARY_BUTTON_CLASS } from "@/app/components/ui";
import { codeFromText } from "@/app/lib/code";

// Camera scanning needs HTTPS (or localhost); typing the code always works.
export default function QrStep({
  value,
  onChange,
  onSerial,
  onDetected,
}: {
  value: string;
  onChange: (code: string) => void;
  /** The chip serial number when the code came from an NFC tap, otherwise null. */
  onSerial?: (serial: string | null) => void;
  /** Called when a camera scan or an NFC tap finds a code (not when one is typed). */
  onDetected?: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let stopped = false;
    let scanner: import("qr-scanner").default | undefined;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (stopped || !videoRef.current) return;
      scanner = new QrScanner(
        videoRef.current,
        (result) => {
          onChange(result.data);
          onSerial?.(null);
          setScanning(false);
          const found = codeFromText(result.data);
          if (found) onDetected?.(found);
        },
        { preferredCamera: "environment", highlightScanRegion: true },
      );
      try {
        await scanner.start();
      } catch {
        setError("Couldn't open the camera. Allow access, or type the code below.");
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      scanner?.destroy();
    };
  }, [scanning, onChange, onSerial, onDetected]);

  return (
    <div className="flex flex-col gap-4">
      {scanning ? (
        <>
          <video ref={videoRef} className="w-full max-w-sm rounded-xl border border-line" />
          <button
            type="button"
            onClick={() => setScanning(false)}
            className={`${SECONDARY_BUTTON_CLASS} !w-auto self-start`}
          >
            Cancel scan
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setScanning(true);
          }}
          className={`${SECONDARY_BUTTON_CLASS} !w-auto self-start`}
        >
          <Icon name="qr-code" size={16} />
          Scan QR with camera
        </button>
      )}

      <NfcReadButton
        onRead={(tag) => {
          setError(null);
          onChange(tag.code);
          onSerial?.(tag.serial);
          onDetected?.(tag.code);
        }}
      />

      {error && <p className="text-sm text-[#c2372e]">{error}</p>}

      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink">
        Or type the code
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSerial?.(null);
          }}
          placeholder="e.g. 7k3m9xq2wd4h"
          autoCapitalize="none"
          autoComplete="off"
          className={`${INPUT_CLASS} !h-10 !rounded-lg !text-sm font-mono`}
        />
      </label>
    </div>
  );
}
