import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";
import Icon from "@/app/components/app-icon";
import NotificationBell from "@/app/components/notification-bell";

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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-4 sm:gap-3 sm:px-8">
        {crumbs ? (
          <nav aria-label="Breadcrumb" className="min-w-0 truncate text-sm text-muted">
            {crumbs.map((crumb, i) => (
              <span
                key={crumb.label}
                className={i < crumbs.length - 1 ? "hidden sm:inline" : undefined}
              >
                {i > 0 ? <span className="hidden sm:inline"> / </span> : null}
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
          <form
            action="/search"
            role="search"
            className="relative w-full max-w-[360px] min-w-0 flex-1 sm:flex-none"
          >
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
              name="q"
              minLength={2}
              maxLength={80}
              aria-label="Search animals and records"
              placeholder="Search animals and records"
              className="h-9 w-full rounded-lg border border-line bg-white pl-[42px] pr-3.5 text-sm text-ink placeholder:text-[#a0a7b0]"
            />
          </form>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/scan"
            aria-label="Scan a QR code or NFC tag"
            className="flex size-10 items-center justify-center rounded-xl text-muted hover:text-ink"
          >
            <Icon name="qr-code" size={20} />
          </Link>
          <NotificationBell />
          <SignOutButton className="hidden h-10 rounded-xl sm:block border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-[#f6f8fa]" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 py-5 sm:px-8 sm:py-7">{children}</main>
    </div>
  );
}
