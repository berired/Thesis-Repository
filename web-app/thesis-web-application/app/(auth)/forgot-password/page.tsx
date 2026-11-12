import { notFound } from "next/navigation";
import { emailEnabled } from "@/app/lib/email";
import ForgotPasswordForm from "./forgot-password-form";

export default function ForgotPasswordPage() {
  // Reset links are emailed, so the page is off until email is set up.
  if (!emailEnabled) notFound();
  return <ForgotPasswordForm />;
}
