import { redirectIfSignedIn } from "@/app/lib/session";
import { safeNext } from "@/app/lib/safe-next";
import SignUpForm from "./sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await redirectIfSignedIn(next);
  return (
    <SignUpForm
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      next={next ? safeNext(next) : null}
    />
  );
}
