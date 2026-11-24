import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { endOfToday } from "@/app/lib/care";
import OwnerSidebar from "@/app/components/owner-sidebar";
import { accessiblePets } from "@/app/lib/pet-access";
import { unreadMessageCount } from "@/app/lib/messaging";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();


  // Badge on "Reminders": things overdue or due by the end of today.
  const reminderCount = await prisma.reminder.count({
    where: {
      completedAt: null,
      dueAt: { lt: endOfToday() },
      pet: { ...accessiblePets(session.user.id), archivedAt: null },
    },
  });

  const messageCount = await unreadMessageCount(session.user.id);

  return (
    <div className="flex min-h-screen bg-cream pb-[72px] text-ink lg:pb-0">
      <OwnerSidebar
        userName={session.user.name}
        reminderCount={reminderCount}
        messageCount={messageCount}
      />
      {children}
    </div>
  );
}
