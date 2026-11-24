import { dayKey, yearOf } from "@/app/lib/time";
import Icon from "@/app/components/app-icon";
import {
  CATEGORY_ICON,
  repeatLabel,
  STATE_CHIP,
  STATE_ICON,
  STATE_LABEL,
  fmtDay,
  fmtFull,
  fmtTime,
  reminderState,
} from "@/app/lib/care";
import ReminderActions from "@/app/components/reminder-actions";
import type { ReminderCategory, ReminderRepeat } from "@/app/generated/prisma/client";

type ReminderData = {
  id: string;
  title: string;
  category: ReminderCategory;
  dueAt: Date;
  repeat: ReminderRepeat;
  repeatEvery: number;
  assignee?: { name: string } | null;
  assigneeId?: string | null;
};

function dueLabel(dueAt: Date, state: ReturnType<typeof reminderState>) {
  if (state === "overdue") return `Overdue · ${fmtDay(dueAt)}`;
  const now = new Date();
  if (dayKey(dueAt) === dayKey(now)) return `Today, ${fmtTime(dueAt)}`;
  return yearOf(dueAt) === yearOf(now)
    ? `${fmtDay(dueAt)}, ${fmtTime(dueAt)}`
    : fmtFull(dueAt);
}

export default function ReminderCard({
  reminder,
  petName,
  canDelete = true,
  viewerId,
}: {
  reminder: ReminderData;
  petName: string;
  /** Only an animal's owner can delete its reminders; caretakers can only complete theirs. */
  canDelete?: boolean;
  /** When given, the card says who the reminder is for ("You", a name, or "Anyone"). */
  viewerId?: string;
}) {
  const state = reminderState(reminder.dueAt);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-3.5 transition-shadow hover:shadow-[3px_3px_0_var(--color-butter)]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef3fb] text-sky">
        <Icon name={CATEGORY_ICON[reminder.category]} size={18} />
      </span>
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <p className="leave-title break-words text-[15px] font-semibold leading-[22.5px] text-ink">
          {reminder.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-[19.5px] text-muted">
          <span>{petName}</span>
          <span aria-hidden="true">·</span>
          <span>{dueLabel(reminder.dueAt, state)}</span>
          {viewerId ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {reminder.assigneeId === null || reminder.assigneeId === undefined
                  ? "Anyone"
                  : reminder.assigneeId === viewerId
                    ? "You"
                    : (reminder.assignee?.name ?? "A caretaker")}
              </span>
            </>
          ) : null}
          {reminder.repeat !== "NONE" ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Icon name="repeat" size={12} />
                {repeatLabel(reminder.repeat, reminder.repeatEvery)}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <span
        className={`flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold ${STATE_CHIP[state]}`}
      >
        {state === "upcoming" ? null : <Icon name={STATE_ICON[state]} size={12} />}
        {STATE_LABEL[state]}
      </span>
      <ReminderActions
        id={reminder.id}
        title={reminder.title}
        repeats={reminder.repeat !== "NONE"}
        canDelete={canDelete}
      />
    </li>
  );
}
