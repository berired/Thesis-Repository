import { ViewTransition } from "react";

/**
 * A template (unlike a layout) is made again on every navigation, so the page inside it gets an
 * enter and an exit: the old page fades out, the new one fades up. The sidebar lives in the layout
 * and doesn't move. Browsers without view transitions simply swap pages as before.
 */
export default function OwnerTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
