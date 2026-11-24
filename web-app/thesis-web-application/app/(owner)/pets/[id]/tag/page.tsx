import QRCode from "qrcode";
import { prisma } from "@/app/lib/prisma";
import { getOwnedPet } from "@/app/lib/pet-data";
import { petPhotoSrc } from "@/app/components/pet-avatar";
import { qrUrlForCode } from "@/app/lib/qr";
import { getPublicSettings, loadScanSource } from "@/app/lib/scan-data";
import { setLostMode } from "@/app/(owner)/actions";
import Icon from "@/app/components/app-icon";
import PetShell from "../pet-shell";
import SettingsPanel from "./settings-panel";

export default async function TagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pet = await getOwnedPet(id);

  const [settings, source, owner] = await Promise.all([
    getPublicSettings(pet.id),
    loadScanSource(pet.id),
    prisma.user.findUniqueOrThrow({ where: { id: pet.ownerId }, select: { city: true } }),
  ]);
  const code = pet.qrCode?.code ?? null;
  const svg = code
    ? await QRCode.toString(qrUrlForCode(code), { type: "svg", margin: 0, errorCorrectionLevel: "H" })
    : null;

  return (
    <PetShell pet={pet} active="tag">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col items-center gap-3 rounded-3xl bg-forest p-6 text-center">
            <h2 className="font-display text-[32px] leading-9 text-butter">{pet.name}&apos;s tag</h2>
            {svg && code ? (
              <>
                <div
                  role="img"
                  aria-label={`QR code ${code}`}
                  className="size-[200px] rounded-xl bg-white p-3 shadow-[5px_5px_0_var(--color-butter)] [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <p className="break-all font-mono text-sm text-white">{code}</p>
                <a
                  href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                  download={`${pet.name}-tag-${code}.svg`}
                  className="flex h-10 items-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-4 text-sm font-semibold text-ink"
                >
                  <Icon name="download" size={16} />
                  Download
                </a>
              </>
            ) : (
              <p className="text-sm text-white">No tag has been assigned to this animal yet.</p>
            )}
          </section>

          <section
            className={`flex flex-col gap-2 rounded-xl border p-4 ${
              pet.lostMode ? "border-[#e8c26a] bg-[#fff6d1]" : "border-line bg-white"
            }`}
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="circle-alert" size={16} />
              Lost mode is {pet.lostMode ? "on" : "off"}
            </h2>
            <p className="text-[13px] text-muted">
              {pet.lostMode
                ? `Anyone who scans ${pet.name}'s tag sees what you allow below, and can contact you the ways you switched on.`
                : `Turn it on if ${pet.name} goes missing. Until then, scanning the tag shows nothing.`}
            </p>
            <form action={setLostMode.bind(null, pet.id)}>
              {pet.lostMode ? null : <input type="hidden" name="lost" value="on" />}
              <button
                type="submit"
                className="h-9 rounded-lg border border-[#c3c9d1] bg-white px-4 text-sm font-semibold text-ink"
              >
                {pet.lostMode ? "Turn off lost mode" : "Turn on lost mode"}
              </button>
            </form>
          </section>
        </div>

        {source ? (
          <SettingsPanel
            petId={pet.id}
            initial={settings}
            source={source}
            species={pet.species}
            memberNo={code ?? "no-tag"}
            photoUrl={petPhotoSrc(pet, "large")}
            ownerHasCity={Boolean(owner.city)}
            lost={pet.lostMode}
          />
        ) : null}
      </div>
    </PetShell>
  );
}
