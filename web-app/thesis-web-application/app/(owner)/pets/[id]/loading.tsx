import { Skeleton, SkeletonPage, SkeletonRows } from "@/app/components/skeleton";

// An animal's page: the green banner, the tab bar, then two columns of cards.
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-6 rounded-3xl bg-forest px-5 py-5 sm:px-8 sm:py-7">
        <Skeleton className="size-[84px] shrink-0 rounded-full !bg-white/20 sm:size-[116px]" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-10 w-48 !bg-white/20 sm:h-14" />
          <Skeleton className="h-6 w-40 !bg-white/20" />
        </div>
      </div>
      <div className="flex gap-3 border-b border-line pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-52" />
        <SkeletonRows count={3} />
      </div>
    </SkeletonPage>
  );
}
