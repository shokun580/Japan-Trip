// The trip's name and dates. `compact` is the home page's one-line version, which
// has a whole screen of cards to fit under it.
export function AppHeader({ name, dates, compact = false }: { name: string; dates: string; compact?: boolean }) {
  if (compact) return <header className="flex items-baseline justify-between gap-3">
    <h1 className="min-w-0 truncate text-[1.35rem] leading-tight font-bold tracking-tight">{name}</h1>
    <p className="shrink-0 text-[.8rem] text-[var(--muted)]">{dates}</p>
  </header>;
  return <header className="mb-5 sm:mb-7">
    <p className="eyebrow mb-1.5">Japan companion</p>
    <h1 className="truncate text-[clamp(1.65rem,7vw,2.55rem)] leading-tight font-bold tracking-tight">{name}</h1>
    <p className="mt-1 text-[.92rem] text-[var(--ink)] sm:text-base">{dates}</p>
  </header>;
}
