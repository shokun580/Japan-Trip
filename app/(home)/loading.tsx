// Shown the moment someone taps back to the itinerary, while the server reads the
// trip. Its blocks sit where the real header, flight card, checklist card, day bar
// and first activities land, so the page fills in rather than jumping into place.
// It lives in the (home) group so it only ever stands in for this page.
export default function HomeLoading() {
  return <main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดแผนเที่ยว">
    <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
      <div className="min-w-0 flex-1">
        <div className="skeleton-line h-3 w-32" />
        <div className="skeleton-line mt-3 h-8 w-56 max-w-full" />
        <div className="skeleton-line mt-2.5 h-4 w-36" />
      </div>
      <div className="skeleton h-12 w-12 rounded-2xl" />
    </div>
    <div className="skeleton-dark h-[104px] rounded-[22px]" />
    <div className="skeleton mt-4 h-[76px] rounded-[22px]" />
    <div className="skeleton mt-4 h-[86px] rounded-[20px]" />
    <div className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-[22px]" />)}</div>
  </main>;
}
