import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();

  const qr = await prisma.qrCode.findUnique({
    where: { code },
    include: { pet: { select: { id: true, ownerId: true } } },
  });
  const session = await getSession();

  let body: React.ReactNode;

  if (!qr || qr.status === "REVOKED") {
    body = <p>This QR code isn&apos;t valid.</p>;
  } else if (qr.status === "UNUSED") {
    const target = `/pets/new?code=${encodeURIComponent(code)}`;
    if (session) redirect(target);
    const next = encodeURIComponent(target);
    body = (
      <>
        <p>This tag isn&apos;t registered yet. Sign in to register your pet.</p>
        <div className="flex gap-3">
          <Link
            href={`/sign-in?next=${next}`}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Sign in
          </Link>
          <Link href={`/sign-up?next=${next}`} className="rounded border px-4 py-2">
            Sign up
          </Link>
        </div>
      </>
    );
  } else {
    if (qr.pet && session?.user.id === qr.pet.ownerId) {
      redirect(`/pets/${qr.pet.id}`);
    }
    body = <p>This QR code is already registered.</p>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {body}
    </main>
  );
}
