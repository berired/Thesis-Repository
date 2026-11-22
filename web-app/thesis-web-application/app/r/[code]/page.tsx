import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";
import { getPetPhotoUrl } from "@/app/lib/storage";
import { PetAvatar } from "@/app/components/pet-avatar";
import { fmtFull, shortAge } from "@/app/lib/care";

// Scan pages are for whoever holds the tag, not for search engines.
export const metadata = { robots: { index: false, follow: false } };

export default async function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();

  const qr = await prisma.qrCode.findUnique({
    where: { code },
    include: {
      pet: {
        select: {
          id: true,
          ownerId: true,
          name: true,
          species: true,
          breed: true,
          sex: true,
          color: true,
          birthDate: true,
          birthDateApproximate: true,
          allergies: true,
          microchip: true,
          photoKey: true,
          archivedAt: true,
          lostMode: true,
          owner: {
            select: { name: true, phone: true, address: true, showPhone: true, showAddress: true },
          },
          records: {
            where: { type: "VACCINATION", voidedAt: null },
            orderBy: { recordDate: "desc" },
            take: 1,
            select: { title: true, recordDate: true },
          },
        },
      },
    },
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
    const pet = qr.pet;
    if (!pet || pet.archivedAt) {
      body = <p>This tag isn&apos;t active right now.</p>;
    } else {
      const photoUrl = pet.photoKey ? await getPetPhotoUrl(pet.photoKey, 300) : null;
      const vaccine = pet.records[0];
      const facts: [string, string | null][] = [
        ["Colour", pet.color],
        ["Allergies", pet.allergies],
        [
          "Last vaccine",
          vaccine ? `${vaccine.title} · ${fmtFull(vaccine.recordDate)}` : "No vaccine records",
        ],
        ["Microchip", pet.microchip],
      ];
      // Contact details leave the server only while lost mode is on, and only the ones
      // the owner switched on.
      const phone = pet.lostMode && pet.owner.showPhone ? pet.owner.phone : null;
      const address = pet.lostMode && pet.owner.showAddress ? pet.owner.address : null;
      body = (
        <div className="flex w-full flex-col gap-4 rounded-[20px] border-2 border-ink bg-white p-6 text-left shadow-[8px_8px_0_var(--color-butter)]">
          {pet.lostMode ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border-2 border-[#c2372e] bg-[#fdecea] p-4"
            >
              <p className="font-display text-[26px] leading-7 text-[#a42a22]">
                This pet is lost
              </p>
              <p className="text-sm text-ink">
                {pet.name} is missing. Please contact {pet.owner.name.split(/\s+/)[0]}.
              </p>
              {phone || address ? (
                <div className="flex flex-col gap-2 text-sm">
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                      className="flex h-11 items-center justify-center rounded-xl bg-sky px-4 font-semibold text-white"
                    >
                      Call {phone}
                    </a>
                  ) : null}
                  {address ? (
                    <p>
                      <span className="text-muted">Address: </span>
                      <span className="font-medium">{address}</span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  The owner hasn&apos;t shared contact details.
                </p>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-4">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`${pet.name}'s photo`}
                className="size-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <PetAvatar name={pet.name} species={pet.species} size={64} />
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-[32px] leading-9 text-forest">
                {pet.name}
              </h1>
              <p className="text-sm text-muted">
                {[
                  pet.species,
                  pet.breed,
                  pet.sex === "MALE" ? "Male" : "Female",
                  shortAge(pet.birthDate, pet.birthDateApproximate),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <dt className="w-[100px] shrink-0 text-muted">{label}</dt>
                <dd className="min-w-0 font-medium">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="rounded-lg bg-cream px-3 py-2 text-[13px] text-muted">
            Registered by {pet.owner.name.split(/\s+/)[0]}. Found {pet.name}? Please let
            the owner know.
          </p>
        </div>
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {body}
    </main>
  );
}
