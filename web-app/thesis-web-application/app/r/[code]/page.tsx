import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/app/components/app-icon";
import ScanCard, { CALL_BUTTON, MESSAGE_BUTTON, SMS_BUTTON } from "@/app/components/scan-card";
import { startThread } from "@/app/(owner)/messages/actions";
import { prisma } from "@/app/lib/prisma";
import { getPublicSettings, loadScanSource } from "@/app/lib/scan-data";
import { applySettings } from "@/app/lib/scan-view";
import { getPetAccess } from "@/app/lib/pet-access";
import { getSession } from "@/app/lib/session";
import { petPhotoUrl } from "@/app/lib/pet-photo";

// Scan pages are for whoever holds the tag, not for search engines.
export const metadata = { robots: { index: false, follow: false } };

const PLAIN = "rounded-[20px] border-2 border-ink bg-cream p-6 text-left shadow-[8px_8px_0_var(--color-butter)]";

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ limit?: string }>;
}) {
  const { code: raw } = await params;
  const { limit } = await searchParams;
  const code = raw.toLowerCase();

  const qr = await prisma.qrCode.findUnique({
    where: { code },
    select: {
      status: true,
      pet: {
        select: {
          id: true,
          ownerId: true,
          species: true,
          photoKey: true,
          archivedAt: true,
          lostMode: true,
          owner: { select: { phone: true } },
        },
      },
    },
  });
  const session = await getSession();

  let body: React.ReactNode;

  if (!qr || qr.status === "REVOKED") {
    body = <p className={PLAIN}>This QR code isn&apos;t valid.</p>;
  } else if (qr.status === "UNUSED") {
    const target = `/pets/new?code=${encodeURIComponent(code)}`;
    if (session) redirect(target);
    const next = encodeURIComponent(target);
    body = (
      <div className={`${PLAIN} flex flex-col gap-4`}>
        <p>This tag isn&apos;t registered yet. Sign in to register your pet.</p>
        <div className="flex gap-3">
          <Link href={`/sign-in?next=${next}`} className="rounded bg-black px-4 py-2 text-white">
            Sign in
          </Link>
          <Link href={`/sign-up?next=${next}`} className="rounded border px-4 py-2">
            Sign up
          </Link>
        </div>
      </div>
    );
  } else {
    const pet = qr.pet;
    // The owner and the animal's caretakers go to the animal, not the finder view.
    if (pet && session && (await getPetAccess(session.user.id, pet.id))) redirect(`/pets/${pet.id}`);

    if (!pet || pet.archivedAt) {
      body = <p className={PLAIN}>This tag isn&apos;t active right now.</p>;
    } else if (!pet.lostMode) {
      // Nothing about a pet that isn't lost is shown to a stranger.
      body = (
        <p className={PLAIN}>
          This tag is registered with Pawket Book. Its owner hasn&apos;t marked the pet as lost, so
          there&apos;s nothing to show here.
        </p>
      );
    } else {
      const [settings, source] = await Promise.all([getPublicSettings(pet.id), loadScanSource(pet.id)]);
      const view = source ? applySettings(source, settings) : null;
      if (!view || !source) {
        body = <p className={PLAIN}>This tag isn&apos;t active right now.</p>;
      } else {
        const photoUrl = pet.photoKey ? await petPhotoUrl(pet.photoKey, 300) : null;
        const phone = view.canCall ? (pet.owner.phone ?? "").replace(/[^\d+]/g, "") : "";
        const next = encodeURIComponent(`/r/${code}`);
        const nobody = !phone && !view.canMessage;

        body = (
          <ScanCard
            view={view}
            species={pet.species}
            memberNo={code}
            photoUrl={photoUrl}
            actions={
              <>
                {phone ? (
                  <>
                    <a href={`sms:${phone}`} className={SMS_BUTTON}>
                      <Icon name="message-square" size={18} />
                      Text my owner
                    </a>
                    <a href={`tel:${phone}`} className={CALL_BUTTON}>
                      <Icon name="phone" size={18} />
                      Call my owner
                    </a>
                  </>
                ) : null}
                {view.canMessage ? (
                  session ? (
                    <form action={startThread.bind(null, code)}>
                      <button type="submit" className={MESSAGE_BUTTON}>
                        <Icon name="message-circle" size={18} />
                        Message in app
                      </button>
                    </form>
                  ) : (
                    <Link href={`/sign-in?next=${next}`} className={MESSAGE_BUTTON}>
                      <Icon name="message-circle" size={18} />
                      Sign in to message in app
                    </Link>
                  )
                ) : null}
                {limit ? (
                  <p role="alert" className="text-center text-xs text-[#a42a22]">
                    You&apos;ve started several conversations recently. Please try again later.
                  </p>
                ) : null}
                {nobody ? (
                  <p className="text-center text-[13px] text-muted">
                    The owner hasn&apos;t turned on any way to contact them here.
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted">
                    In-app messages need a Pawket Book account. Texting works for everyone.
                  </p>
                )}
              </>
            }
          />
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-forest px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <p className="font-display text-[26px] leading-[26px] text-butter">Pawket Book</p>
        {body}
        <p className="text-sm text-white">
          Shared by the owner through Pawket Book
          <br />
          <Link href="/" className="font-medium text-butter underline">
            Get Pawket Book for your pets
          </Link>
        </p>
      </div>
    </main>
  );
}
