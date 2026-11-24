import { SkeletonChips, SkeletonPage, SkeletonRows, SkeletonTitle } from "@/app/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <SkeletonChips count={4} />
      <SkeletonRows count={5} />
    </SkeletonPage>
  );
}
