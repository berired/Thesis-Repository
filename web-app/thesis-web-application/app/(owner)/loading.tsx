import { SkeletonPage, SkeletonRows, SkeletonTitle } from "@/app/components/skeleton";

// Shown while any signed-in page without its own loading screen fetches its data.
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <SkeletonRows count={4} />
    </SkeletonPage>
  );
}
