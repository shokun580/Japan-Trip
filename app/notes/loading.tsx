import { BottomNavHold } from "@/components/bottom-nav";

// Back link, title and a few note cards, where the real ones land.
export default function NotesLoading() {
  return <><main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดโน้ต">
    <div className="flex h-12 items-center justify-between">
      <div className="skeleton-line h-4 w-14" />
      <div className="skeleton h-12 w-32 rounded-2xl" />
    </div>
    <div className="skeleton-line mt-5 h-7 w-24" />
    <div className="skeleton-line mt-2 h-4 w-64" />
    <div className="mt-5 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-[22px]" />)}</div>
  </main><BottomNavHold/></>;
}
