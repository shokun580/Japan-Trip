import { BottomNavHold } from "@/components/bottom-nav";

// Back link, title row and a few poll cards, where the real ones land.
export default function VoteLoading() {
  return <><main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดโหวต">
    <div className="flex h-12 items-center justify-between">
      <div className="skeleton-line h-4 w-14" />
      <div className="skeleton h-12 w-28 rounded-2xl" />
    </div>
    <div className="skeleton-line mt-5 h-3 w-24" />
    <div className="skeleton-line mt-2 h-7 w-40" />
    <div className="mt-5 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-44 rounded-[22px]" />)}</div>
  </main><BottomNavHold/></>;
}
