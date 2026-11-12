import SignUpForm from "./sign-up-form";

export default function SignUpPage() {
  return <SignUpForm googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />;
}
