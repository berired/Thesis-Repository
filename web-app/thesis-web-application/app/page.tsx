import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import {
  LayerIcon,
  PAW_LAYERS,
  Sticker,
  StickerLink,
  Wordmark,
} from "@/app/components/ui";

const ANIMALS = ["Dogs", "Cats", "Hens", "Reptiles", "Fish", "Rabbits", "Birds", "Goats"];

/** The paw icon at 48px, where the design uses a slightly different stroke bleed. */
const PAW_LAYERS_LARGE = [
  { ...PAW_LAYERS[0], bleed: "-18.75%" },
  { ...PAW_LAYERS[1], bleed: "-18.75%" },
  { ...PAW_LAYERS[2], bleed: "-18.75%" },
  { ...PAW_LAYERS[3], bleed: "-6.25%" },
];

const FEATURES = [
  {
    stamp: "Records",
    title: "Health records",
    body: "Vaccines, meds and vet notes, for hens too.",
    rotate: -8,
    tone: "border-sky bg-[#eef3fb] text-sky",
    layers: [
      { src: "/icons/records-1.svg", inset: "8.33% 16.67%", bleed: "-5% -6.25%" },
      { src: "/icons/records-2.svg", inset: "8.33% 16.67% 66.67% 58.33%", bleed: "-16.67%" },
      { src: "/icons/records-3.svg", inset: "41.62% 54.16% 25% 8.34%", bleed: "-12.48% -11.11%" },
    ],
  },
  {
    stamp: "Reminders",
    title: "Care reminders",
    body: "Feeding, deworming and habitat checks that repeat.",
    rotate: 6,
    tone: "border-blush-ink bg-blush-soft text-blush-ink",
    layers: [
      { src: "/icons/reminders-1.svg", inset: "8.33% 12.5% 29.17% 12.5%", bleed: "-6.67% -5.56%" },
      { src: "/icons/reminders-2.svg", inset: "87.5% 42.92% 8.31% 42.92%", bleed: "-99.49% -29.42%" },
      { src: "/icons/reminders-3.svg", inset: "8.33% 83.33% 66.67% 8.33%", bleed: "-16.67% -50%" },
      { src: "/icons/reminders-4.svg", inset: "8.33% 8.33% 66.67% 83.33%", bleed: "-16.67% -50%" },
    ],
  },
  {
    stamp: "Vets",
    title: "Vets near you",
    body: "Find a clinic that treats your species and request a visit.",
    rotate: -4,
    tone: "border-[#0f6b47] bg-[#ddf1e8] text-[#0f6b47]",
    layers: [
      { src: "/icons/vets-1.svg", inset: "8.33% 16.67%", bleed: "-5% -6.25%" },
      { src: "/icons/vets-2.svg", inset: "29.17% 37.5% 45.83% 37.5%", bleed: "-16.67%" },
    ],
  },
];

const FOOTER_COLUMNS = [
  { heading: "Product", links: ["Features", "Find a vet", "For clinics", "QR tags"] },
  { heading: "Help", links: ["Help centre", "Contact us", "Report a problem"] },
  { heading: "Pawket Book", links: ["About us", "Privacy policy", "Terms of use"] },
];

const PASSPORT_FIELDS = [
  ["Name", "Biscuit"],
  ["Species · breed", "Dog · Aspin"],
  ["Born", "4 Jun 2023"],
  ["Owner", "Ana Reyes"],
];

/** Hero illustration: a pocket book resting on an open passport page. */
function PocketBookArt() {
  return (
    <div className="relative mx-auto hidden h-[580px] w-full max-w-[480px] lg:block">
      {/* Passport page */}
      <div
        style={{ transform: "rotate(5deg)" }}
        className="absolute left-[150px] top-[30px] h-[500px] w-[380px] rounded-bl-md rounded-br-[18px] rounded-tl-md rounded-tr-[18px] border-[3px] border-ink bg-cream shadow-[6px_6px_0_var(--color-blush)]"
      >
        <div className="absolute inset-x-6 top-[54px] flex gap-3.5">
          <div className="flex h-[150px] w-[120px] shrink-0 items-center justify-center rounded border-[3px] border-line bg-white p-[9px]">
            <div className="relative flex size-full flex-col items-center justify-center gap-1 bg-[rgba(127,127,127,0.08)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/image-placeholder.svg" alt="" width={28} height={28} />
              <span className="text-[13px] font-semibold tracking-[0.13px] text-ink opacity-75">
                Pet photo
              </span>
              <span className="pointer-events-none absolute inset-0 border-[3px] border-dashed border-ink opacity-35" />
            </div>
          </div>
          <dl className="flex min-w-0 flex-1 flex-col gap-2">
            {PASSPORT_FIELDS.map(([label, value]) => (
              <div key={label} className="h-[44.5px] border-b-[3px] border-line">
                <dt className="-mt-px text-[11px] leading-[16.5px] text-muted">{label}</dt>
                <dd className="text-sm font-semibold leading-[21px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="absolute inset-x-6 top-[269px] flex flex-col gap-1.5">
          <span className="text-[11px] leading-[16.5px] text-muted">Pawprint of pet</span>
          <div className="flex h-[70px] items-center justify-center rounded-[10px] border-[3px] border-dashed border-[#c3c9d1]">
            <LayerIcon size={34} layers={PAW_LAYERS} />
          </div>
        </div>
        <div className="absolute left-[131px] top-[405px]">
          <Sticker color="blue" shape="tag" rotate={5.65}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/paw-sticker.svg" alt="" width={18} height={18} />
            For every kind of animal
          </Sticker>
        </div>
      </div>

      {/* Pocket book cover */}
      <div
        style={{ transform: "rotate(-7deg)" }}
        className="absolute left-0 top-[70px] h-[400px] w-[280px] rounded-bl-[10px] rounded-br-[20px] rounded-tl-[10px] rounded-tr-[20px] border-l-[12px] border-[#21437d] bg-sky shadow-[8px_8px_0_var(--color-butter)]"
      >
        <p className="absolute inset-x-0 top-[30px] text-center text-xs font-semibold leading-[18px] tracking-[1.92px] text-butter">
          PET INFORMATION
        </p>
        <div className="absolute left-1/2 top-[138px] flex size-[110px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-butter">
          <div className="flex size-[90px] items-center justify-center rounded-full border-[3px] border-dashed border-butter">
            <LayerIcon size={48} layers={PAW_LAYERS_LARGE} />
          </div>
        </div>
        <p className="absolute inset-x-0 top-[333px] text-center font-display text-[32px] leading-8 tracking-[0.32px] text-butter">
          Pawket Book
        </p>
        <div className="absolute -left-[33px] top-[70px]">
          <Sticker color="pink" rotate={-5.6}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/heart.svg" alt="" width={18} height={18} />
            All caught up
          </Sticker>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(session.user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="overflow-x-clip bg-forest">
      <div className="mx-auto max-w-[1280px]">
        <header className="flex h-20 items-center gap-7 px-6 lg:px-14">
          <Wordmark />
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/sign-in" className="text-[15px] font-medium text-white">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="flex h-10 items-center rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink"
            >
              Get started
            </Link>
          </nav>
        </header>

        <section className="grid gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-14 lg:pb-20">
          <div className="flex flex-col items-start">
            <h1 className="font-display text-6xl leading-[0.9] text-butter md:text-8xl lg:text-[112px]">
              One <span className="text-white">Pawket</span>
              <br />
              <span className="text-white">Book</span> for
              <br />
              the whole
              <br />
              pack!
            </h1>
            <p className="mt-6 max-w-[460px] text-lg leading-[27px] text-white">
              Their records, reminders and vet visits, stamped and sorted in one
              pocket book you can show any clinic.
            </p>
            <div className="mt-6 pl-1">
              <StickerLink href="/sign-up" rotate={-3} className="border-[3px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/arrow-right.svg" alt="" width={18} height={18} />
                Get your free passport
              </StickerLink>
            </div>
          </div>

          <PocketBookArt />
        </section>
      </div>

      <div
        aria-hidden="true"
        className="-mx-6 -rotate-[1.5deg] overflow-hidden whitespace-nowrap border-y-[3px] border-ink bg-blush py-[18px]"
      >
        <div className="flex w-max animate-marquee font-display text-4xl leading-9 text-ink motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-9 pr-9">
              {ANIMALS.flatMap((animal) => [animal, "·"]).map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-10 lg:px-14">
        <div
          style={{ transform: "rotate(-1.5deg)" }}
          className="relative max-w-[564px] rounded-[20px] border-[3px] border-ink bg-cream px-8 pb-8 pt-7 shadow-[8px_8px_0_var(--color-butter)]"
        >
          <p className="text-xs font-semibold leading-[18px] text-muted">
            Member&apos;s pocket book
          </p>
          <p className="mt-3 text-[13px] font-medium leading-[17.5px] text-ink">
            This pocket book belongs to
          </p>
          <p className="mt-4 border-b-[3px] border-ink px-1 pb-[7px] pt-3 font-display text-4xl leading-9 text-muted">
            Your name here
          </p>
          <div className="absolute -right-3 top-5">
            <Sticker color="pink" shape="tag" rotate={5} className="border-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/its-free.svg" alt="" width={16} height={16} />
              It&apos;s free
            </Sticker>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <h2 className="font-display text-4xl leading-none text-butter lg:text-[56px] lg:leading-[56px]">
            Sign your pocket book
          </h2>
          <p className="mt-4 text-base leading-6 text-white">
            Add every animal you care for.
          </p>
          <div className="mt-5 pl-1">
            <StickerLink href="/sign-up" rotate={-3} className="border-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right.svg" alt="" width={18} height={18} />
              Become a member
            </StickerLink>
          </div>
        </div>
      </section>

      <section id="features" className="bg-cream">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-11 px-6 pb-20 pt-[85px] lg:px-14">
          <h2 className="text-center font-display text-4xl leading-none text-forest lg:text-[56px] lg:leading-[56px]">
            Stamped, signed, sorted
          </h2>
          <ul className="grid gap-12 sm:grid-cols-3 sm:gap-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex flex-col items-center text-center">
                <div
                  style={{ transform: `rotate(${feature.rotate}deg)` }}
                  className={`flex size-[210px] items-center justify-center rounded-full border-[3px] ${feature.tone}`}
                >
                  <div className="flex size-[180px] flex-col items-center justify-center gap-1.5 rounded-full border-[3px] border-dashed border-current">
                    <LayerIcon size={44} layers={feature.layers} />
                    <span className="font-display text-[28px] leading-7">
                      {feature.stamp}
                    </span>
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold leading-[26px] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-[250px] text-[15px] leading-[22.5px] text-muted">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto max-w-[1280px] px-6 pb-10 pt-[72px] lg:px-14">
        <div className="rounded-3xl bg-sky p-3 shadow-[10px_10px_0_var(--color-butter)]">
          <div className="relative grid gap-10 rounded-[14px] bg-cream px-6 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-11">
            <div>
              <p className="font-display text-[34px] leading-[34px] tracking-[0.34px] text-forest">
                Pawket Book
              </p>
              <p className="mt-3.5 max-w-[280px] text-[15px] leading-[22.5px] text-muted">
                The pocket notebook for every animal you care for.
              </p>
              <p className="mt-6 text-[13px] font-medium leading-[17.5px] text-ink">
                If found, please return to
              </p>
              <a
                href="mailto:pawketbook.co@gmail.com"
                className="mt-1.5 block border-b-2 border-ink px-0.5 pb-2.5 font-display text-2xl leading-7 text-sky"
              >
                pawketbook.co@gmail.com
              </a>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading} className="self-start">
                <p className="border-b-2 border-ink pb-3 text-[13px] font-medium leading-[17.5px] text-muted">
                  {column.heading}
                </p>
                <ul>
                  {column.links.map((label) => (
                    <li
                      key={label}
                      className="border-b border-line pb-[11px] pt-2.5 text-[15px] font-medium leading-[22.5px]"
                    >
                      {label === "Features" ? (
                        <a href="#features" className="text-ink">
                          {label}
                        </a>
                      ) : (
                        <span
                          aria-disabled="true"
                          title="Coming soon"
                          className="cursor-not-allowed select-none text-[#a0a7b0]"
                        >
                          {label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div
              aria-hidden="true"
              style={{ transform: "rotate(-12deg)" }}
              className="absolute -bottom-[62px] right-[158px] hidden size-[124px] items-center justify-center rounded-full border-[3px] border-blush-ink bg-blush-soft lg:flex"
            >
              <div className="flex size-[104px] flex-col items-center justify-center gap-[3px] rounded-full border border-dashed border-blush-ink">
                <LayerIcon
                  size={20}
                  layers={[
                    { src: "/icons/care-heart.svg", inset: "12.5% 8.35%", bleed: "-5.56% -5%" },
                  ]}
                />
                <p className="text-center font-display text-[17px] leading-[17px] text-blush-ink">
                  Made with
                  <br />
                  care
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] leading-[19.5px] text-white">
          <span>© 2026 Pawket Book</span>
          <span aria-hidden="true">·</span>
          <span>Pawket Book keeps your records organised — it doesn&apos;t diagnose.</span>
          <div aria-hidden="true" className="flex gap-2 sm:ml-auto">
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-butter">
              <LayerIcon
                size={18}
                layers={[
                  { src: "/icons/instagram-1.svg", inset: "8.33%", bleed: "-5%" },
                  { src: "/icons/instagram-2.svg", inset: "33.15% 33.15% 33.51% 33.51%", bleed: "-12.5%" },
                  { src: "/icons/instagram-3.svg", inset: "27.08% 27.04% 72.92% 72.92%", bleed: "-0.75px" },
                ]}
              />
            </span>
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-butter">
              <LayerIcon
                size={18}
                layers={[
                  { src: "/icons/facebook.svg", inset: "8.33% 25% 8.33% 29.17%", bleed: "-5% -9.09%" },
                ]}
              />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
