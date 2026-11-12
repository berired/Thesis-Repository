"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
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

// Birds and Rabbits come from the design; the rest are matching outline icons.
const ANIMALS = [
  { label: "Dogs", icon: "/icons/chip-dog.svg" },
  { label: "Cats", icon: "/icons/chip-cat.svg" },
  { label: "Birds", icon: "/icons/chip-bird.svg" },
  { label: "Poultry", icon: "/icons/chip-egg.svg" },
  { label: "Reptiles", icon: "/icons/chip-turtle.svg" },
  { label: "Fish", icon: "/icons/chip-fish.svg" },
  { label: "Rabbits", icon: "/icons/chip-rabbit.svg" },
];

export default function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [animals, setAnimals] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleAnimal(label: string) {
    setAnimals((current) =>
      current.includes(label)
        ? current.filter((a) => a !== label)
        : [...current, label],
    );
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8 || !/\d/.test(password)) {
      setError("Use at least 8 characters, with a number.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    const { data, error } = await authClient.signUp.email({
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email,
      password,
      animalTypes: animals.join(","),
      callbackURL: "/dashboard",
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? "Unable to sign up");
      return;
    }
    // A session token comes back only when no email confirmation is required.
    if (data?.token) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    router.push(`/check-email?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (error) setError(error.message ?? "Google sign-in failed");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:gap-14 lg:px-[72px]">
      <section className="flex min-w-0 flex-1 flex-col gap-7 lg:self-stretch lg:pt-10">
        <Wordmark />
        <h1 className="mt-6 font-display text-7xl leading-[0.77] text-butter lg:text-[112px]">
          Join the
          <br />
          pack.
        </h1>
        <p className="max-w-[420px] text-lg leading-[27px] text-white">
          One place for every animal&apos;s records, reminders and vet visits.
        </p>
        <div className="hidden pl-[86px] pt-2 lg:block">
          <Polaroid
            caption="caption here"
            tape="yellow"
            shadow="pink"
            rotate={-4}
            tapeRotate={4}
            tapePosition="left-[99px]"
            photo="h-[200px]"
            className="w-[300px]"
          />
        </div>
      </section>

      <AuthCard className="w-full shrink-0 lg:w-[520px]">
        <h2 className="text-2xl font-semibold leading-[31.2px] text-ink">
          Create your account
        </h2>

        {googleEnabled ? (
          <>
            <GoogleButton onClick={handleGoogle} />
            <OrDivider />
          </>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="First name">
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Last name">
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
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
          <Field label="Password" hint="At least 8 characters, with a number">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium leading-[17.55px] text-ink">
              Which animals do you care for?
            </legend>
            <div className="flex flex-wrap gap-2">
              {ANIMALS.map(({ label, icon }) => {
                const selected = animals.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleAnimal(label)}
                    className={`flex h-[26px] items-center gap-1 rounded-full border px-2.5 text-xs font-medium ${
                      selected
                        ? "border-sky bg-[#eef3fb] text-[#2a559e]"
                        : "border-[#c3c9d1] bg-white text-ink"
                    }`}
                  >
                    {selected ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/icons/chip-check.svg" alt="" width={13} height={13} />
                    ) : icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={icon} alt="" width={13} height={13} />
                    ) : null}
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-start gap-2.5 text-[15px] leading-[21px] text-ink">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-px size-5 shrink-0 rounded-md accent-sky"
            />
            I agree to the Terms and Privacy Policy
          </label>

          <FormError message={error} />

          <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-sky underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
