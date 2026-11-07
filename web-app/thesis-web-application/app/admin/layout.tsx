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
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/pets">Pets</Link>
          <Link href="/admin/qr-codes">QR codes</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
