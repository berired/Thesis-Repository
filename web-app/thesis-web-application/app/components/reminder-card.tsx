import Icon from "@/app/components/icon";
import {
  CATEGORY_ICON,
  REPEAT_LABEL,
  STATE_CHIP,
  STATE_ICON,
  STATE_LABEL,
  fmtDay,
  fmtFull,
  fmtTime,
  reminderState,
} from "@/app/lib/care";
import { completeReminder } from "@/app/(owner)/actions";
import type { ReminderCategory, ReminderRepeat } from "@/app/generated/prisma/client";

type ReminderData = {
  id: string;
  title: string;
  category: ReminderCategory;
  dueAt: Date;
  repeat: ReminderRepeat;
};

function dueLabel(dueAt: Date, state: ReturnType<typeof reminderState>) {
  if (state === "overdue") return `Overdue · ${fmtDay(dueAt)}`;
  const now = new Date();
  if (dueAt.toDateString() === now.toDateString()) return `Today, ${fmtTime(dueAt)}`;
  return dueAt.getFullYear() === now.getFullYear()
    ? `${fmtDay(dueAt)}, ${fmtTime(dueAt)}`
    : fmtFull(dueAt);
}

export default function ReminderCard({
  reminder,
  petName,
}: {
  reminder: ReminderData;
  petName: string;
}) {
  const state = reminderState(reminder.dueAt);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef3fb] text-sky">
        <Icon name={CATEGORY_ICON[reminder.category]} size={18} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[15px] font-semibold leading-[22.5px] text-ink">
          {reminder.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-[19.5px] text-muted">
          <span>{petName}</span>
          <span aria-hidden="true">·</span>
          <span>{dueLabel(reminder.dueAt, state)}</span>
          {reminder.repeat !== "NONE" ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Icon name="repeat" size={12} />
                {REPEAT_LABEL[reminder.repeat]}
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
      <form action={completeReminder.bind(null, reminder.id)}>
        <button
          type="submit"
          aria-label={`Mark "${reminder.title}" done`}
          title="Mark done"
          className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:border-[#0f6b47] hover:bg-[#ddf1e8] hover:text-[#0f6b47]"
        >
          <Icon name="check" size={14} />
        </button>
      </form>
    </li>
  );
}
