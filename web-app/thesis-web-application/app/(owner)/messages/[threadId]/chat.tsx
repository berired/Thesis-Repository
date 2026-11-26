"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FormError } from "@/app/components/ui";
import { fmtDay, fmtTime } from "@/app/lib/time";
import { reportThread, sendMessage, setBlocked } from "../actions";

type Msg = { id: string; senderId: string; body: string; createdAt: string };

const POLL_MS = 4000;

/** The open conversation: shows messages, polls for new ones while the tab is visible, and sends. */
export default function Chat({
  threadId,
  selfId,
  otherName,
  petName,
  initial,
  initialBlocked,
  iBlocked,
}: {
  threadId: string;
  selfId: string;
  otherName: string;
  petName: string;
  initial: Msg[];
  initialBlocked: boolean;
  iBlocked: boolean;
}) {
  const [messages, setMessages] = useState(initial);
  const [blocked, setBlockedState] = useState(initialBlocked);
  const [youBlocked, setYouBlocked] = useState(iBlocked);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [pending, start] = useTransition();
  const last = useRef<string | null>(initial.at(-1)?.createdAt ?? null);
  const end = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  // Messages that were already there when the chat opened don't animate; later ones slide in.
  const [openingIds] = useState(() => new Set(initial.map((m) => m.id)));
  const form = useRef<HTMLFormElement>(null);

  const merge = useCallback((incoming: Msg[]) => {
    if (incoming.length === 0) return;
    last.current = incoming.at(-1)!.createdAt;
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id));
      return [...current, ...incoming.filter((m) => !seen.has(m.id))];
    });
  }, []);

  const poll = useCallback(async () => {
    const url = `/api/messages/${threadId}${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 404) return setGone(true);
      if (!res.ok) return;
      const data = await res.json();
      setBlockedState(Boolean(data.blocked));
      merge(data.messages);
    } catch {
      // A dropped connection just means the next poll tries again.
    }
  }, [threadId, merge]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void poll();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: firstScroll.current ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [messages.length]);

  if (gone) {
    return (
      <p className="max-w-[560px] rounded-xl border border-line bg-white p-6 text-sm text-muted">
        This conversation is no longer available. The pet may have been archived or messaging turned off.
      </p>
    );
  }

  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-[30px] leading-9 text-forest">
          {otherName} <span className="text-muted">about {petName}</span>
        </h1>
        <div className="flex items-center gap-4 text-[13px]">
          {!blocked || youBlocked ? (
            <button
              type="button"
              className="font-medium text-sky underline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const next = !blocked;
                  const result = await setBlocked(threadId, next);
                  if ("error" in result) return setError(result.error);
                  setError(null);
                  setBlockedState(next);
                  setYouBlocked(next);
                })
              }
            >
              {blocked ? "Unblock" : "Block"}
            </button>
          ) : null}
          {!reported ? (
            <button
              type="button"
              className="font-medium text-[#b42318] underline"
              onClick={() => setReporting((v) => !v)}
            >
              Report
            </button>
          ) : (
            <span className="text-muted">Reported</span>
          )}
        </div>
      </div>

      {reporting && !reported ? (
        <form
          className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4"
          action={(fd) =>
            start(async () => {
              const result = await reportThread(threadId, String(fd.get("reason") ?? ""));
              if ("error" in result) return setError(result.error);
              setError(null);
              setReported(true);
              setReporting(false);
              setBlockedState(true);
              setYouBlocked(true);
            })
          }
        >
          <label htmlFor="report-reason" className="text-[13px] font-medium">
            What is wrong with this conversation? The admin will read it, and it will be blocked.
          </label>
          <textarea
            id="report-reason"
            name="reason"
            rows={3}
            maxLength={500}
            required
            className="rounded-lg border border-[#c3c9d1] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 w-fit rounded-lg bg-[#b42318] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send report
          </button>
        </form>
      ) : null}

      <div
        className="flex h-[min(480px,60vh)] flex-col gap-2 overflow-y-auto rounded-xl border border-line bg-white p-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-muted">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === selfId;
            const at = new Date(m.createdAt);
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"} ${
                  openingIds.has(m.id) ? "" : mine ? "animate-slide-in-right" : "animate-slide-in-left"
                }`}
              >
                <p
                  className={`max-w-[80%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-sky text-white" : "bg-cream text-ink"
                  }`}
                >
                  {m.body}
                </p>
                <span className="mt-0.5 text-[11px] text-muted">
                  {fmtDay(at)}, {fmtTime(at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>

      {blocked ? (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
          This conversation is blocked, so no one can send messages.
          {youBlocked ? " You can unblock it above." : ""}
        </p>
      ) : (
        <form
          ref={form}
          className="flex flex-col gap-2"
          action={(fd) =>
            start(async () => {
              const result = await sendMessage(threadId, String(fd.get("body") ?? ""));
              if ("error" in result) return setError(result.error);
              setError(null);
              form.current?.reset();
              await poll();
            })
          }
        >
          <textarea
            name="body"
            rows={2}
            maxLength={1000}
            required
            aria-label="Message"
            placeholder="Write a message"
            className="rounded-lg border border-[#c3c9d1] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-10 w-fit rounded-xl bg-sky px-5 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
      <FormError message={error} />
      <p className="text-xs text-muted">
        Messages are only for finding and returning {petName}. Don&apos;t share anything you
        don&apos;t want the other person to have.
      </p>
    </div>
  );
}
