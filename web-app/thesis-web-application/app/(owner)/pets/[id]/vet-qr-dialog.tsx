"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/app/components/app-icon";
import { PRIMARY_BUTTON_CLASS } from "@/app/components/ui";
import { createRecordRequest } from "./vet-qr-actions";

const OPTIONS: { key: string; label: string; on: boolean }[] = [
  { key: "ALLERGIES", label: "Allergies", on: true },
  { key: "VACCINES", label: "Vaccine status", on: true },
  { key: "MEDICATION", label: "Current medication", on: false },
  { key: "NOTES", label: "Additional notes", on: false },
];

/** True for addresses only this device (or its own network) can open, which a vet's phone cannot. */
function isLocalAddress(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      host === "localhost" ||
      host === "[::1]" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

function remaining(expiresAt: string, now: number) {
  const ms = Math.max(0, new Date(expiresAt).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** "Generate vet QR": pick what the vet may read, then show the one-time QR and link. */
export default function VetQrDialog({ petId, petName }: { petId: string; petName: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [chosen, setChosen] = useState(() => OPTIONS.filter((o) => o.on).map((o) => o.key));
  const [result, setResult] = useState<{ url: string; svg: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!result) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [result]);

  function generate() {
    setError(null);
    start(async () => {
      const res = await createRecordRequest(petId, chosen);
      if ("error" in res) setError(res.error);
      else {
        setResult(res);
        setNow(Date.now());
        router.refresh();
      }
    });
  }

  function close() {
    ref.current?.close();
    // The link can't be shown again, so closing clears it.
    setResult(null);
    setError(null);
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Select the link and copy it by hand.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex h-10 items-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink"
      >
        <Icon name="stethoscope" size={16} />
        Generate vet QR
      </button>

      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
        onClose={() => {
          setResult(null);
          setError(null);
        }}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-[20px] border-2 border-ink bg-white p-0 text-ink shadow-[8px_8px_0_var(--color-butter)] backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4 px-6 py-6">
          <h2 className="font-display text-[26px] leading-[30px] text-forest">
            Vet QR for {petName}
          </h2>

          {result ? (
            <>
              <p className="text-sm text-muted">
                Show this to the vet. It works once and lasts 24 hours, and it can&apos;t be shown
                again after you close this.
              </p>
              <div
                role="img"
                aria-label="Vet QR code"
                className="mx-auto size-[220px] rounded-xl border border-line p-2 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: result.svg }}
              />
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                <Icon name="clock" size={15} />
                Expires in {remaining(result.expiresAt, now)}
              </p>
              {isLocalAddress(result.url) ? (
                <p role="alert" className="rounded-lg bg-[#fff6d1] px-3 py-2 text-xs text-[#7a5a00]">
                  This QR points to {new URL(result.url).host}, which only works on this device or
                  network. A vet&apos;s phone can&apos;t open it. Open Pawket Book at its public
                  address and make the QR there.
                </p>
              ) : null}
              <input
                readOnly
                value={result.url}
                aria-label="Vet link"
                onFocus={(e) => e.currentTarget.select()}
                className="h-10 w-full rounded-lg border border-line bg-[#f6f8fa] px-3 text-xs"
              />
              <div className="flex gap-2">
                <button type="button" onClick={copy} className={`${PRIMARY_BUTTON_CLASS} !h-10`}>
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="h-10 shrink-0 rounded-lg border border-[#c3c9d1] px-4 text-sm font-semibold"
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Choose what the vet can see. They always see {petName}&apos;s name, species, age and
                sex, and never your contact details.
              </p>
              <fieldset className="flex flex-col gap-2.5">
                <legend className="sr-only">What the vet can see</legend>
                {OPTIONS.map((o) => (
                  <label key={o.key} className="flex items-center gap-2.5 text-[15px]">
                    <input
                      type="checkbox"
                      checked={chosen.includes(o.key)}
                      onChange={(e) =>
                        setChosen((c) => (e.target.checked ? [...c, o.key] : c.filter((k) => k !== o.key)))
                      }
                      className="size-4 accent-[#356ac3]"
                    />
                    {o.label}
                  </label>
                ))}
              </fieldset>
              {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generate}
                  disabled={pending}
                  className={`${PRIMARY_BUTTON_CLASS} !h-10`}
                >
                  {pending ? "Making QR..." : "Generate QR"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="h-10 shrink-0 rounded-lg border border-[#c3c9d1] px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          {result && error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
        </div>
      </dialog>
    </>
  );
}
