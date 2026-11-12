import { requireUser } from "@/app/lib/session";
import OwnerSidebar from "@/app/components/owner-sidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <OwnerSidebar userName={session.user.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-8">
          <div className="relative w-[360px] max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/search.svg"
              alt=""
              width={18}
              height={18}
              className="pointer-events-none absolute left-3.5 top-[9px]"
            />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search animals, records, clinics"
              className="h-9 w-full rounded-lg border border-line bg-white pl-[42px] pr-3.5 text-sm text-ink placeholder:text-[#a0a7b0]"
            />
          </div>
          <div className="ml-auto flex">
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-10 items-center justify-center rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/bell.svg" alt="" width={20} height={20} />
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
