"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import {
  LayerIcon,
  PAW_LAYERS,
  Polaroid,
  Sticker,
  Wordmark,
} from "@/app/components/ui";

const RESEND_SECONDS = 45;

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function CheckEmail({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    if (secondsLeft > 0 || !email) return;
    setMessage(null);
    setSecondsLeft(RESEND_SECONDS);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    setMessage(error ? (error.message ?? "Could not resend the email.") : "Sent again.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-20 items-center px-6 lg:px-[72px]">
        <Wordmark />
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-start justify-center gap-12 px-6 py-10 lg:flex-row lg:items-center lg:px-[72px]">
        <section className="flex min-w-0 flex-1 flex-col items-start gap-5">
          <Sticker color="pink" shape="tag" rotate={-4}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/mail.svg" alt="" width={18} height={18} />
            Check your inbox
          </Sticker>
          <h1 className="font-display text-7xl leading-[0.9] text-butter lg:text-[112px]">
            Welcome to
            <br />
            the pack!
          </h1>
          <p className="max-w-[480px] text-lg leading-[27px] text-white">
            We sent a confirmation link to{" "}
            {email ? <strong className="font-bold">{email}</strong> : "your email"}.
            Open it to finish setting up your account.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="mailto:"
              className="inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3.5 pb-[9px] pt-[7px] font-display text-xl leading-5 text-ink shadow-[3px_3px_0_var(--color-ink)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right.svg" alt="" width={18} height={18} />
              Open email app
            </a>
            <p className="text-[15px] text-white">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={secondsLeft > 0 || !email}
                className="font-medium underline disabled:no-underline"
              >
                {secondsLeft > 0 ? `Resend in ${formatClock(secondsLeft)}` : "Resend"}
              </button>
            </p>
          </div>
          <p role="status" className="min-h-6 text-sm text-butter">
            {message}
          </p>
        </section>

        <div className="hidden w-[440px] shrink-0 justify-center lg:flex">
          <Polaroid
            caption="caption here"
            tape="blue"
            shadow="yellow"
            rotate={4}
            tapeRotate={-3}
            tapePosition="left-[139px]"
            photo="h-[340px]"
            displayCaption
            className="w-[380px] px-4 pb-[22px] pt-4 shadow-[6px_6px_0_var(--color-butter)]"
          />
        </div>
      </div>

      <footer className="flex items-center gap-4 border-t-[3px] border-ink bg-powder px-6 py-5 lg:px-[72px]">
        <LayerIcon size={22} layers={PAW_LAYERS} />
        <p className="flex flex-wrap gap-x-4 text-[15px] leading-[22.5px]">
          <span className="font-semibold text-ink">Next: add your first animal</span>
          <span className="text-[#1f5a82]">It takes about a minute.</span>
        </p>
      </footer>
    </div>
  );
}
