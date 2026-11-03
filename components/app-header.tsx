export function AppHeader({ name, dates }: { name: string; dates: string; person?: string }) {
  return <header className="mb-5 sm:mb-7">
    <p className="eyebrow mb-1.5">Japan companion</p>
    <h1 className="truncate text-[clamp(1.65rem,7vw,2.55rem)] leading-tight font-bold tracking-tight">{name}</h1>
    <p className="mt-1 text-[.92rem] text-[var(--ink)] sm:text-base">{dates}</p>
  </header>;
}
