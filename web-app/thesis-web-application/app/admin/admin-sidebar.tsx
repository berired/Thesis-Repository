"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/app/components/app-icon";
import PopBadge from "@/app/components/pop-badge";
import SignOutButton from "@/app/components/sign-out-button";

type NavItem = { label: string; icon: IconName; href: string; exact?: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: "house", href: "/admin", exact: true },
  { label: "Users", icon: "users", href: "/admin/users" },
  { label: "Pets", icon: "paw-print", href: "/admin/pets" },
  { label: "Vet records", icon: "stethoscope", href: "/admin/records" },
  { label: "Messages", icon: "message-square", href: "/admin/messages" },
  { label: "QR codes", icon: "qr-code", href: "/admin/qr-codes" },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "A"
  );
}

export default function AdminSidebar({
  userName,
  email,
  badges,
}: {
  userName: string;
  email: string;
  /** Open items waiting on an admin, keyed by nav label. */
  badges: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const activeIndex = NAV_ITEMS.findIndex(isActive);

  return (
    <>
      {/* Desktop: the same forest sidebar as the owner side, with a slide-along highlight. */}
      <nav
        aria-label="Admin"
        className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-6 bg-forest px-3 py-5 lg:flex print:hidden"
      >
        <div className="flex flex-col items-start gap-2 px-3 pb-[4.5px]">
          <Link
            href="/admin"
            className="font-display text-[26px] leading-[26px] tracking-[0.26px] text-butter"
          >
            Pawket Book
          </Link>
          <span className="-rotate-2 rounded-lg border-2 border-ink bg-butter px-2.5 pb-[3px] pt-[1px] font-display text-[15px] leading-5 text-ink shadow-[2px_2px_0_var(--color-ink)]">
            Admin
          </span>
        </div>

        <ul className="relative flex flex-col gap-0.5">
          <li
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-11 rounded-[10px] bg-butter transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              activeIndex < 0 ? "opacity-0" : "opacity-100"
            }`}
            style={{ transform: `translateY(${Math.max(activeIndex, 0) * 46}px)` }}
          />
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const badge = badges[item.label];
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-300 motion-reduce:transition-none ${
                    active ? "font-semibold text-ink" : "font-medium text-white hover:bg-white/10"
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span className="flex-1 pb-px">{item.label}</span>
                  {badge ? (
                    <PopBadge
                      id={`admin-side-${item.label}`}
                      count={badge}
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1.5 text-[11px] font-semibold text-white"
                    >
                      {badge}
                    </PopBadge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-[10px] px-3 py-1.5" title={email}>
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-butter-soft text-[11px] font-semibold text-butter-ink"
            >
              {initials(userName)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-white">{userName}</span>
              <span className="truncate text-xs text-white/70">{email}</span>
            </span>
          </div>
          <SignOutButton className="h-10 rounded-[10px] border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10" />
        </div>
      </nav>

      {/* Phones and tablets: a forest top bar with the sections as a scrolling row of pills. */}
      <header className="sticky top-0 z-40 bg-forest lg:hidden print:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/admin" className="font-display text-[24px] leading-6 text-butter">
            Pawket Book
          </Link>
          <span className="-rotate-2 rounded-md border-2 border-ink bg-butter px-2 pb-px font-display text-[14px] leading-[18px] text-ink">
            Admin
          </span>
          <SignOutButton className="ml-auto h-9 rounded-lg border border-white/25 px-3 text-[13px] font-medium text-white hover:bg-white/10" />
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
          <ul className="flex w-max gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const badge = badges[item.label];
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] ${
                      active
                        ? "bg-butter font-semibold text-ink"
                        : "bg-white/10 font-medium text-white"
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                    {badge ? (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky px-1 text-[11px] font-semibold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
