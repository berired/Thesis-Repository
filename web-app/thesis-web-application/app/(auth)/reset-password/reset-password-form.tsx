"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import {
  AuthCard,
  Field,
  FormError,
  INPUT_CLASS,
  LayerIcon,
  PRIMARY_BUTTON_CLASS,
} from "@/app/components/ui";

function Rule({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-2 text-[13px] leading-[19.5px] ${
        met ? "text-[#157a4f]" : "text-muted"
      }`}
    >
      {met ? (
        <LayerIcon
          size={16}
          layers={[
            {
              src: "/icons/check-green.svg",
              inset: "25% 16.67% 29.17% 16.67%",
              bleed: "-9.09% -6.25%",
            },
          ]}
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-full border border-current opacity-60"
        />
      )}
      {children}
      <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
    </li>
  );
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const longEnough = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const matches = password.length > 0 && password === confirm;

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!longEnough || !hasNumber || !matches) {
      setError("Check the password rules below.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not reset your password.");
      return;
    }
    router.push("/sign-in");
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="New password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>

        <ul className="flex flex-col gap-1.5 rounded-xl bg-[#f6f8fa] px-3.5 py-3">
          <Rule met={longEnough}>At least 8 characters</Rule>
          <Rule met={hasNumber}>Includes a number</Rule>
          <Rule met={matches}>Passwords match</Rule>
        </ul>

        <FormError message={error} />

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </AuthCard>
  );
}
