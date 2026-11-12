"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/app/lib/auth-client";
import {
  AuthCard,
  Field,
  FormError,
  INPUT_CLASS,
  PRIMARY_BUTTON_CLASS,
  Sticker,
  Wordmark,
} from "@/app/components/ui";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Something went wrong. Try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <header className="flex h-20 w-full items-center px-6 lg:px-[72px]">
        <Wordmark />
      </header>

      <h1 className="mt-6 max-w-[800px] px-6 text-center font-display text-5xl leading-[1.05] text-butter lg:mt-14 lg:text-[72px] lg:leading-[76px]">
        Forgot your password?
        <br />
        It happens.
      </h1>

      <div className="relative mt-10 w-full max-w-[460px] px-6 sm:px-0">
        <div className="absolute -top-6 right-10 z-10 sm:-right-4 sm:-top-7">
          <Sticker color="blue" shape="tag" rotate={8}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/key.svg" alt="" width={18} height={18} />
            No judgement
          </Sticker>
        </div>
        <AuthCard>
          {sent ? (
            <p role="status" className="text-[15px] leading-[22.5px] text-muted">
              If there&apos;s an account for <strong className="text-ink">{email}</strong>,
              a reset link is on its way. It can take a minute to arrive.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-[15px] leading-[22.5px] text-muted">
                Enter the email you signed up with and we&apos;ll send you a link to
                reset it.
              </p>
              <Field label="Email">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <FormError message={error} />
              <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
          <Link
            href="/sign-in"
            className="flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-[15px] font-semibold text-sky"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/arrow-left.svg" alt="" width={18} height={18} />
            Back to sign in
          </Link>
        </AuthCard>
      </div>
    </div>
  );
}
