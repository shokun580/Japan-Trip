// Fills the space under the settings tabs, which stay put while a tab loads.
export default function ManageLoading() {
  return <div className="card skeleton-screen grid gap-4 p-5 sm:p-7" aria-busy="true" aria-label="กำลังโหลด">
    <div><div className="skeleton-line h-6 w-36" /><div className="skeleton-line mt-2 h-3.5 w-64 max-w-full" /></div>
    {[0, 1, 2].map((i) => <div key={i}><div className="skeleton-line h-3.5 w-20" /><div className="skeleton-line mt-2 h-12 rounded-[13px]" /></div>)}
    <div className="skeleton-line h-12 w-36 rounded-xl" />
  </div>;
}
