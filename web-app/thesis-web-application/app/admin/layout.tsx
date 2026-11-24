import Link from "next/link";
import { requireAdmin } from "@/app/lib/session";
import SignOutButton from "@/app/components/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6 print:hidden">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/pets">Pets</Link>
          <Link href="/admin/records">Vet records</Link>
          <Link href="/admin/messages">Messages</Link>
          <Link href="/admin/qr-codes">QR codes</Link>
        </nav>
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="truncate">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="overflow-x-auto p-4 sm:p-6 print:p-0">{children}</main>
    </div>
  );
}
