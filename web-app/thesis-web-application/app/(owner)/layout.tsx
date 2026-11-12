import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { endOfToday } from "@/app/lib/care";
import OwnerSidebar from "@/app/components/owner-sidebar";

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
      pet: { ownerId: session.user.id, archivedAt: null },
    },
  });

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <OwnerSidebar userName={session.user.name} reminderCount={reminderCount} />
      {children}
    </div>
  );
}
