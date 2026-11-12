"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={className ?? "rounded border px-3 py-1 text-sm"}
    >
      Sign out
    </button>
  );
}
