import type { Metadata } from "next";
import RecordForm from "@/app/components/record-form";
import { PRIMARY_BUTTON_CLASS } from "@/app/components/ui";
import { fmtFull, fmtTime, shortAge } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { clientKey, rateLimit } from "@/app/lib/rate-limit";
import { todayInput } from "@/app/lib/time";
import { SECTION_LABEL, SESSION_MINUTES, currentVetState, type VetState } from "@/app/lib/vet-access";
import { startVetSession } from "./actions";

// The care-tips job runs after the response (see actions.ts) and needs a little time.
export const maxDuration = 60;

// Never indexed, and the token must not leak through the Referer header.
export const metadata: Metadata = {
  title: "Add a health record | Pawket Book",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-forest px-4 py-8 text-ink">
      <p className="mb-5 font-display text-[28px] leading-8 text-butter">Pawket Book</p>
      <div className="w-full max-w-[760px] rounded-2xl bg-cream p-5 shadow-[8px_8px_0_var(--color-butter)] sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-center text-sm text-white">
        Shared by an animal&apos;s owner through Pawket Book
      </p>
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Frame>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] leading-9 text-forest">{title}</h1>
        <p className="text-[15px] leading-6 text-muted">{children}</p>
      </div>
    </Frame>
  );
}

const MESSAGE: Record<"unknown" | "revoked" | "used" | "burned" | "expired", [string, string]> = {
  unknown: ["This link isn't valid", "Check that you scanned the whole QR code, or ask the owner for a new one."],
  revoked: ["This QR was cancelled", "The owner cancelled it. Ask them for a new one if you still need to add a record."],
  used: ["This QR has already been used", "A record was already sent with it. Ask the owner for a new QR to add another."],
  burned: ["This link has already been opened", "Each QR works for one visit. Ask the owner for a new one."],
  expired: ["This QR has expired", "QR codes last 24 hours. Ask the owner for a new one."],
};

type Session = Extract<VetState, { kind: "session" }>;

async function Summary({ state }: { state: Session }) {
  const { pet, sections } = state.request;
  const has = (s: (typeof sections)[number]) => sections.includes(s);

  const [vaccines, medication] = await Promise.all([
    has("VACCINES")
      ? prisma.healthRecord.findMany({
          where: { petId: pet.id, type: "VACCINATION", voidedAt: null },
          orderBy: { recordDate: "desc" },
          take: 10,
          select: { id: true, title: true, recordDate: true, nextDueDate: true },
        })
      : Promise.resolve([]),
    has("MEDICATION")
      ? prisma.healthRecord.findMany({
          where: { petId: pet.id, type: "MEDICATION", voidedAt: null },
          orderBy: { recordDate: "desc" },
          take: 10,
          select: { id: true, title: true, dose: true, recordDate: true, endDate: true },
        })
      : Promise.resolve([]),
  ]);

  const basics: [string, string][] = [
    ["Name", pet.name],
    ["Species", pet.breed ? `${pet.species} · ${pet.breed}` : pet.species],
    [
      "Age and sex",
      `${shortAge(pet.birthDate, pet.birthDateApproximate)} · ${pet.sex === "MALE" ? "male" : "female"}`,
    ],
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
      <h2 className="text-lg font-semibold leading-6">About {pet.name}</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {basics.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {sections.length === 0 ? (
        <p className="text-[13px] text-muted">The owner is sharing only the basics.</p>
      ) : null}
      {has("ALLERGIES") ? (
        <div>
          <h3 className="text-[13px] font-semibold text-muted">{SECTION_LABEL.ALLERGIES}</h3>
          <p className="text-sm">{pet.allergies || "None recorded"}</p>
        </div>
      ) : null}
      {has("VACCINES") ? (
        <div>
          <h3 className="text-[13px] font-semibold text-muted">{SECTION_LABEL.VACCINES}</h3>
          {vaccines.length === 0 ? (
            <p className="text-sm">None recorded</p>
          ) : (
            <ul className="text-sm">
              {vaccines.map((v) => (
                <li key={v.id}>
                  {v.title}, {fmtFull(v.recordDate)}
                  {v.nextDueDate ? ` · next due ${fmtFull(v.nextDueDate)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {has("MEDICATION") ? (
        <div>
          <h3 className="text-[13px] font-semibold text-muted">{SECTION_LABEL.MEDICATION}</h3>
          {medication.length === 0 ? (
            <p className="text-sm">None recorded</p>
          ) : (
            <ul className="text-sm">
              {medication.map((m) => (
                <li key={m.id}>
                  {m.title}
                  {m.dose ? `, ${m.dose}` : ""} · from {fmtFull(m.recordDate)}
                  {m.endDate ? ` to ${fmtFull(m.endDate)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {has("NOTES") ? (
        <div>
          <h3 className="text-[13px] font-semibold text-muted">{SECTION_LABEL.NOTES}</h3>
          <p className="whitespace-pre-line text-sm">{pet.medicalNotes || "None recorded"}</p>
        </div>
      ) : null}
    </section>
  );
}

export default async function VetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!(await rateLimit("vet-page", await clientKey(), 60, 60))) {
    return <Notice title="Too many requests">Please wait a minute and try again.</Notice>;
  }

  const state = await currentVetState(token);

  if (state.kind !== "fresh" && state.kind !== "session") {
    const [title, body] = MESSAGE[state.kind];
    return <Notice title={title}>{body}</Notice>;
  }

  // Opening the link changes nothing, so link previews and bots can't spend it. Only Start does.
  if (state.kind === "fresh") {
    return (
      <Frame>
        <form action={startVetSession.bind(null, token)} className="flex flex-col gap-4">
          <h1 className="font-display text-[30px] leading-9 text-forest">
            Add a health record
          </h1>
          <p className="text-[15px] leading-6 text-muted">
            An animal&apos;s owner asked you to add one health record. This link works once: when you
            tap Start you have {SESSION_MINUTES} minutes to send your record and any files, and the
            QR is used up afterwards.
          </p>
          <button type="submit" className={`${PRIMARY_BUTTON_CLASS} !w-auto self-start px-8`}>
            Start
          </button>
        </form>
      </Frame>
    );
  }

  const { request, submitted } = state;
  if (submitted) {
    return (
      <Notice title="Thank you, your record was sent">
        The owner of {request.pet.name} can now see it, marked as added by you. This QR is used up.
        You can close this page.
      </Notice>
    );
  }

  const endsAt = request.sessionExpiresAt;
  return (
    <Frame>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[30px] leading-9 text-forest">
            Add a record for {request.pet.name}
          </h1>
          {endsAt ? (
            <p className="text-[13px] text-muted">
              Your session ends at {fmtTime(endsAt)}. One record per QR.
            </p>
          ) : null}
        </div>
        <Summary state={state} />
        <RecordForm
          pets={[{ id: request.pet.id, name: request.pet.name }]}
          defaultPetId={request.pet.id}
          today={todayInput()}
          vet={{ token }}
        />
      </div>
    </Frame>
  );
}
