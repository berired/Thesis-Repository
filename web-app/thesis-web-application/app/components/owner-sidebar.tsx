"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/components/app-icon";

type NavItem = {
  label: string;
  icon: string;
  href?: string;
  /** Path prefix that highlights this item, for sections without their own page yet. */
  section?: string;
  badge?: number;
};

// Only Home has a page of its own so far; the rest are inert until built.
const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "/icons/home.svg", href: "/dashboard" },
  { label: "My animals", icon: "/icons/paw-nav.svg", href: "/pets", section: "/pets" },
  { label: "Health records", icon: "/icons/records.svg", href: "/records", section: "/records" },
  { label: "Reminders", icon: "/icons/bell-nav.svg", href: "/reminders", section: "/reminders" },
  { label: "Find a vet", icon: "/icons/map-pin-nav.svg" },
  { label: "Messages", icon: "/icons/message.svg", href: "/messages", section: "/messages" },
];

// The bottom bar has room for five, so the account link stands in for the rest.
const MOBILE_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  { label: "Me", icon: "", href: "/account", section: "/account" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default function OwnerSidebar({
  userName,
  reminderCount = 0,
  messageCount = 0,
}: {
  userName: string;
  reminderCount?: number;
  messageCount?: number;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.section !== undefined
      ? pathname.startsWith(item.section)
      : item.href !== undefined && pathname === item.href;
  const activeIndex = NAV_ITEMS.findIndex(isActive);

  return (
    <>
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-6 bg-forest px-3 py-5 lg:flex"
    >
      <div className="px-3 pb-[4.5px]">
        <Link
          href="/dashboard"
          className="font-display text-[26px] leading-[26px] tracking-[0.26px] text-butter"
        >
          Pawket Book
        </Link>
      </div>

      <ul className="relative flex flex-col gap-0.5">
        {/* Highlight pill that slides to the active item (44px item + 2px gap). */}
        <li
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-11 rounded-[10px] bg-butter transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none ${
            activeIndex < 0 ? "opacity-0" : "opacity-100"
          }`}
          style={{ transform: `translateY(${Math.max(activeIndex, 0) * 46}px)` }}
        />
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const badge =
            item.label === "Reminders" ? reminderCount : item.label === "Messages" ? messageCount : item.badge;
          const base =
            "relative flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-300 motion-reduce:transition-none";
          const state = active ? "font-semibold text-ink" : "font-medium text-white";
          const content = (
            <>
              {/* The Figma icons are single-colour but exported in different
                  colours, so force black when active and white otherwise. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                width={20}
                height={20}
                className={`transition-[filter] duration-300 motion-reduce:transition-none ${
                  active ? "brightness-0" : "brightness-0 invert"
                }`}
              />
              <span className="flex-1 pb-px">{item.label}</span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </>
          );

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${base} ${state}`}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={`${base} ${state} cursor-default`}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href="/account"
          aria-current={pathname.startsWith("/account") ? "page" : undefined}
          title="My details"
          className={`flex h-11 items-center gap-3 rounded-[10px] px-3 transition-colors hover:bg-white/10 ${
            pathname.startsWith("/account") ? "bg-white/10" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-butter-soft text-[11px] font-semibold text-butter-ink"
          >
            {initials(userName)}
          </span>
          <span className="truncate pb-px text-sm font-medium text-white">
            {userName}
          </span>
        </Link>
      </div>
    </nav>

    {/* Phones and tablets: a bottom tab bar instead of the sidebar. */}
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-forest px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {MOBILE_ITEMS.map((item) => {
        const active =
          item.section !== undefined
            ? pathname.startsWith(item.section)
            : item.href !== undefined && pathname === item.href;
        const badge = item.label === "Reminders" ? reminderCount : 0;
        const content = (
          <>
            <span
              className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                active ? "bg-butter" : ""
              }`}
            >
              {item.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.icon}
                  alt=""
                  width={22}
                  height={22}
                  className={`transition-[filter] duration-300 motion-reduce:transition-none ${
                    active ? "brightness-0" : "brightness-0 invert"
                  }`}
                />
              ) : (
                <Icon name="user" size={22} className={active ? "text-ink" : "text-white"} />
              )}
              {badge ? (
                <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky px-1 text-[10px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>
              {item.label === "Health records" ? "Records" : item.label}
            </span>
          </>
        );
        const cls = `flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-2 pt-2 text-white ${
          item.href ? "" : "opacity-60"
        }`;
        return item.href ? (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cls}
          >
            {content}
          </Link>
        ) : (
          <span key={item.label} aria-disabled="true" className={`${cls} cursor-default`}>
            {content}
          </span>
        );
      })}
    </nav>
    </>
  );
}
