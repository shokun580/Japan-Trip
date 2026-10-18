// Without this the picker's light skeleton would flash before the dark pad. The
// pad's frame is drawn straight away, keys and all, just not yet answering taps.
export default function PinLoading() {
  return <main className="pin-screen fade-in" aria-busy="true" aria-label="กำลังโหลด">
    <div className="text-center">
      <p className="text-[.85rem] text-[var(--on-dark-soft)]">&nbsp;</p>
      <h1 className="mt-1 text-[clamp(1.9rem,8vw,2.4rem)] leading-tight font-bold tracking-tight">ใส่รหัส PIN</h1>
    </div>
    <div className="pin-dots" aria-hidden>{Array.from({ length: 6 }, (_, i) => <span key={i} className="pin-dot" />)}</div>
    <div className="pin-keys" aria-hidden>{Array.from({ length: 12 }, (_, i) => <span key={i} className="pin-key opacity-60" />)}</div>
  </main>;
}
