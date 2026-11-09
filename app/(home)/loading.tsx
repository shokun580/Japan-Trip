import { BottomNavHold } from "@/components/bottom-nav";

// Shown while the server reads the trip, in the shape of the home page: header,
// the "next up" card, the flight card and the smaller cards under them.
export default function HomeLoading() {
  return <><main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดหน้าหลัก">
    <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
      <div className="min-w-0 flex-1">
        <div className="skeleton-line h-3 w-32" />
        <div className="skeleton-line mt-3 h-8 w-56 max-w-full" />
        <div className="skeleton-line mt-2.5 h-4 w-36" />
      </div>
    </div>
    <div className="skeleton h-[150px] rounded-[22px]" />
    <div className="skeleton-dark mt-3 h-[104px] rounded-[22px]" />
    <div className="skeleton mt-3 h-[150px] rounded-[22px]" />
    <div className="skeleton mt-3 h-[76px] rounded-[22px]" />
  </main><BottomNavHold/></>;
}
