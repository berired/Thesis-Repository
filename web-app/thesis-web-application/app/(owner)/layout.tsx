import Link from "next/link";
import { requireUser } from "@/app/lib/session";
import SignOutButton from "@/app/components/sign-out-button";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="font-semibold">
          My Pets
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span>{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
