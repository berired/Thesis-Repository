import { emailEnabled } from "@/app/lib/email";
import { redirectIfSignedIn } from "@/app/lib/session";
import { safeNext } from "@/app/lib/safe-next";
import SignInForm from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await redirectIfSignedIn(next);
  return (
    <SignInForm
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      emailEnabled={emailEnabled}
      next={next ? safeNext(next) : null}
    />
  );
}
