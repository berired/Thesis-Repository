import { emailEnabled } from "@/app/lib/email";
import SignInForm from "./sign-in-form";

export default function SignInPage() {
  return (
    <SignInForm
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
      emailEnabled={emailEnabled}
    />
  );
}
