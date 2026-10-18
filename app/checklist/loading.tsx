// Mirrors the checklist's own layout — back link, whose list it is, the progress card
// and a run of folded categories — so the list fills in where the blocks already are.
export default function ChecklistLoading() {
  return <main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลดเช็คลิสต์">
    <div className="flex h-12 items-center justify-between">
      <div className="skeleton-line h-4 w-14" />
      <div className="skeleton h-12 w-12 rounded-2xl" />
    </div>
    <div className="mt-5 flex items-center gap-3">
      <div className="skeleton h-[46px] w-[46px] rounded-full" />
      <div className="flex-1"><div className="skeleton-line h-3 w-20" /><div className="skeleton-line mt-2 h-6 w-32" /></div>
    </div>
    <div className="skeleton mt-4 h-[78px] rounded-[22px]" />
    <div className="mt-10 space-y-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[62px] rounded-[22px]" />)}</div>
  </main>;
}
