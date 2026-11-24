import { SkeletonCard, SkeletonChips, SkeletonPage, SkeletonTitle } from "@/app/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <SkeletonChips />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </SkeletonPage>
  );
}
