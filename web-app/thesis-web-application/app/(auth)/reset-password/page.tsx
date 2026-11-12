import Link from "next/link";
import { AuthCard, Wordmark } from "@/app/components/ui";
import ResetPasswordForm from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const invalid = !token || !!error;

  return (
    <div className="flex min-h-screen flex-col items-center">
      <header className="flex h-20 w-full items-center px-6 lg:px-[72px]">
        <Wordmark />
      </header>

      <h1 className="mt-6 px-6 text-center font-display text-5xl leading-[1.05] text-butter lg:mt-12 lg:text-[72px] lg:leading-[76px]">
        {invalid ? "That link has expired" : "Pick a new password"}
      </h1>

      <div className="mt-9 w-full max-w-[460px] px-6 sm:px-0">
        {invalid ? (
          <AuthCard>
            <p className="text-[15px] leading-[22.5px] text-muted">
              Reset links only work once, and only for an hour. Ask for a fresh one
              and we&apos;ll send it right over.
            </p>
            <Link
              href="/forgot-password"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-sky px-6 text-base font-semibold text-white"
            >
              Send a new link
            </Link>
          </AuthCard>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </div>
  );
}
