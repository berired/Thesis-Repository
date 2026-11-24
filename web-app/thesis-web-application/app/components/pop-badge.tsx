"use client";

import { useEffect } from "react";

// What each badge showed the last time it was drawn. It lives for the whole browser session, so a
// count that changed between two page visits can be noticed even though every page makes a fresh badge.
const lastSeen: Record<string, number> = {};

/** A count badge that bounces when its number changes, and stays still when it doesn't. */
export default function PopBadge({
  id,
  count,
  className,
  children,
}: {
  /** Which badge this is ("bell", "reminders", ...), so each remembers its own number. */
  id: string;
  count: number;
  className: string;
  children: React.ReactNode;
}) {
  const before = lastSeen[id];
  const changed = before !== undefined && before !== count;

  useEffect(() => {
    lastSeen[id] = count;
  }, [id, count]);

  return <span className={`${className} ${changed ? "animate-bump" : ""}`}>{children}</span>;
}
