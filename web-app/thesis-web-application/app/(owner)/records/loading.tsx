import { Skeleton, SkeletonChips, SkeletonPage, SkeletonTitle } from "@/app/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <SkeletonChips count={7} />
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </SkeletonPage>
  );
}
