"use client";

import { useTransition } from "react";
import Icon from "@/app/components/app-icon";
import { completeReminder, deleteReminder } from "@/app/(owner)/reminders/actions";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The row's CSS animates only a fixed height, so measure it first, then switch it to 0 in the
 * next frame. The global stylesheet turns the data-leaving states into the actual motion.
 */
function leave(row: HTMLElement, state: "done" | "collapse" | "delete") {
  if (state !== "done") {
    row.style.height = `${row.offsetHeight}px`;
    void row.offsetHeight; // lets the browser see the fixed height before it changes
  }
  row.dataset.leaving = state;
}

function restore(row: HTMLElement) {
  row.removeAttribute("data-leaving");
  row.style.height = "";
}

/**
 * The tick and trash buttons of a reminder row. Completing plays a tick, strikes the title and
 * (for a reminder that doesn't repeat) folds the row away; deleting folds it away straight off.
 * The real server action runs alongside, and the list updates when both are finished.
 */
export default function ReminderActions({
  id,
  title,
  repeats,
  canDelete,
}: {
  id: string;
  title: string;
  /** A repeating reminder comes back with its next date, so its row is kept. */
  repeats: boolean;
  canDelete: boolean;
}) {
  const [pending, start] = useTransition();

  const run = (button: HTMLButtonElement, kind: "complete" | "delete") => {
    const row = button.closest("li");
    start(async () => {
      let succeeded = false;
      try {
        if (kind === "delete") {
          if (row) leave(row, "delete");
          await Promise.all([deleteReminder(id), sleep(340)]);
        } else {
          if (row) leave(row, "done");
          if (row && !repeats) setTimeout(() => leave(row, "collapse"), 480);
          await Promise.all([completeReminder(id), sleep(repeats ? 760 : 820)]);
        }
        succeeded = true;
      } finally {
        if (!succeeded) {
          // The action failed: put the row back as it was.
          if (row?.isConnected) restore(row);
        } else if (kind === "complete" && repeats && row) {
          // A repeating reminder stays with its next date. Restore it once React has put the new
          // data on screen, so it never shows the old date again. A one-off row is simply removed.
          setTimeout(() => {
            if (row.isConnected) restore(row);
          }, 160);
        }
      }
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => run(e.currentTarget, "complete")}
        aria-label={`Mark "${title}" done`}
        title="Mark done"
        className="leave-check flex size-8 items-center justify-center rounded-full border border-line text-muted hover:border-[#0f6b47] hover:bg-[#ddf1e8] hover:text-[#0f6b47]"
      >
        <Icon name="check" size={14} />
      </button>
      {canDelete ? (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => run(e.currentTarget, "delete")}
          aria-label={`Delete "${title}"`}
          title="Delete"
          className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-[#fde8e6] hover:text-[#b42318]"
        >
          <Icon name="trash-2" size={14} />
        </button>
      ) : null}
    </>
  );
}
