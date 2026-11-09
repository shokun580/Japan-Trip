import { BottomNavHold } from "@/components/bottom-nav";

// Shown while the server reads the trip. Its blocks sit where the real title, day
// bar and first activities land, so the page fills in rather than jumping into place.
export default function PlanLoading() {
  return <><main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดแผนเที่ยว">
    <div className="skeleton-line h-3 w-24" />
    <div className="skeleton-line mt-3 h-7 w-40" />
    <div className="skeleton mt-4 h-[86px] rounded-[20px]" />
    <div className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-[22px]" />)}</div>
  </main><BottomNavHold/></>;
}
