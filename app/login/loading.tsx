// The picker's title and a grid of empty tiles, for the tap on "เปลี่ยนคน".
export default function LoginLoading() {
  return <main className="shell skeleton-screen" aria-busy="true" aria-label="กำลังโหลด">
    <div className="mt-8 flex flex-col items-center sm:mt-12">
      <div className="skeleton-line h-3 w-32" />
      <div className="skeleton-line mt-3 h-9 w-40" />
      <div className="skeleton-line mt-3 h-4 w-64 max-w-full" />
    </div>
    <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-[130px] rounded-[22px]" />)}</div>
  </main>;
}
