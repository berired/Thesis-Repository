"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { safeNext } from "@/app/lib/safe-next";
import {
  AuthCard,
  Field,
  FormError,
  GoogleButton,
  INPUT_CLASS,
  OrDivider,
  Polaroid,
  PRIMARY_BUTTON_CLASS,
  Wordmark,
} from "@/app/components/ui";

function nextPath() {
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

export default function SignInForm({
  googleEnabled,
  emailEnabled,
}: {
  googleEnabled: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: nextPath(),
    });

    setLoading(false);
    if (error) {
      if (error.status === 403) {
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(error.message ?? "Unable to sign in");
      return;
    }
    router.push(nextPath());
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath(),
    });
    if (error) setError(error.message ?? "Google sign-in failed");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:gap-14 lg:px-[72px]">
      <section className="flex min-w-0 flex-1 flex-col gap-7 lg:self-stretch lg:pt-10">
        <Wordmark />
        <h1 className="mt-6 font-display text-7xl leading-[0.835] text-butter lg:text-[112px]">
          Welcome
          <br />
          back.
        </h1>
        <p className="max-w-[420px] text-lg leading-[27px] text-white">
          Your pets care is right where you left it.
        </p>
        <div className="relative mt-3 hidden h-[253px] lg:block">
          <Polaroid
            caption="caption here"
            tape="blue"
            shadow="yellow"
            rotate={-5}
            tapeRotate={4}
            tapePosition="left-[79px]"
            photo="h-[170px]"
            className="absolute left-0 top-0 w-[240px]"
          />
          <Polaroid
            caption="caption here"
            tape="pink"
            shadow="pink"
            rotate={5}
            tapeRotate={-6}
            tapePosition="right-[29px]"
            photo="h-[160px]"
            className="absolute left-[268px] top-6 w-[216px]"
          />
        </div>
      </section>

      <AuthCard className="w-full shrink-0 lg:w-[480px]">
        <h2 className="text-2xl font-semibold leading-[31.2px] text-ink">Sign in</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-5 rounded-md accent-sky"
              />
              Keep me signed in
            </label>
            {emailEnabled ? (
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-sky underline"
              >
                Forgot password?
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title="Password reset by email is coming soon"
                className="cursor-not-allowed select-none text-sm font-medium text-[#a0a7b0]"
              >
                Forgot password?
              </span>
            )}
          </div>

          <FormError message={error} />

          <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {googleEnabled ? (
          <>
            <OrDivider />
            <GoogleButton onClick={handleGoogle} />
          </>
        ) : null}

        <p className="text-center text-[13px] text-muted">
          New to Pawket Book?{" "}
          <Link href="/sign-up" className="text-sky underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
