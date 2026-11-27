import Link from "next/link";
import { after } from "next/server";
import PopBadge from "@/app/components/pop-badge";
import { retryStaleCareTips } from "@/app/lib/care-tips/run";
import { syncDueNotifications, unreadCount } from "@/app/lib/notifications";
import { getSession } from "@/app/lib/session";

/** The header bell: links to Notifications and shows how many are unread. */
export default async function NotificationBell() {
  const session = await getSession();
  // No scheduler yet: due reminders become notifications whenever a page with the bell renders.
  // Layouts render in parallel with pages, so this has to happen here to be counted.
  if (session) await syncDueNotifications(session.user.id);
  // Safety net for care tips whose job never finished. Runs after the page is sent, never blocks it.
  if (session) {
    const userId = session.user.id;
    after(() => retryStaleCareTips(userId).catch((e) => console.error("Care tips retry failed", e)));
  }
  const unread = session ? await unreadCount(session.user.id) : 0;
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative flex size-10 items-center justify-center rounded-xl hover:bg-[#f6f8fa]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/bell.svg" alt="" width={20} height={20} />
      {unread > 0 ? (
        <PopBadge
          id="bell"
          count={unread}
          className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-sky px-1 text-[11px] font-semibold leading-[18px] text-white"
        >
          {unread > 9 ? "9+" : unread}
        </PopBadge>
      ) : null}
    </Link>
  );
}
