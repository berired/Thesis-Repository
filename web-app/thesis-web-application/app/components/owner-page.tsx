import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";
import Icon from "@/app/components/icon";

export type Crumb = { label: string; href?: string };

/** Top bar plus page body used by every signed-in owner page. */
export default function OwnerPage({
  crumbs,
  children,
}: {
  crumbs?: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-8">
        {crumbs ? (
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            {crumbs.map((crumb, i) => (
              <span key={crumb.label}>
                {i > 0 ? " / " : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  crumb.label
                )}
              </span>
            ))}
          </nav>
        ) : (
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
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/pets/new"
            aria-label="Scan a QR tag"
            className="flex size-10 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <Icon name="qr-code" size={20} />
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-10 items-center justify-center rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/bell.svg" alt="" width={20} height={20} />
          </button>
          <SignOutButton className="h-10 rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-[#f6f8fa]" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-8 py-7">{children}</main>
    </div>
  );
}
