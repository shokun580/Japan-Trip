// No accounts: entering the site means picking one of these names, which is kept in
// a cookie, and the checklist and hotel are split by these keys alone. Keys are
// stored in the database, so never rename one — add a new entry instead, or the rows
// behind it are orphaned.
// `tone` only rotates through three palette colours so two people side by side are
// told apart at a glance — it carries no meaning beyond that.
// `short` is written out rather than sliced from the name: Thai leading vowels and
// tone marks make the first two code units land in the wrong place.
export const people = [
  { key: "shokun", name: "โชกุน", short: "โช", tone: "ink" },
  { key: "may", name: "เมย์", short: "เม", tone: "accent" },
  { key: "mom-shokun", name: "แม่โชกุน", short: "แม่", tone: "sky" },
  { key: "mom-may", name: "แม่เมย์", short: "แม่", tone: "ink" },
  { key: "porsche", name: "พอร์ช", short: "พอ", tone: "accent" },
  { key: "oak", name: "โอ๊ค", short: "โอ๊", tone: "sky" },
  { key: "chanon", name: "ชานนท์", short: "ชา", tone: "ink" },
  { key: "dad-shokun", name: "พ่อโชกุน", short: "พ่อ", tone: "accent" },
  { key: "jeewon", name: "จีวร", short: "จี", tone: "sky" },
] as const;

export type PersonKey = (typeof people)[number]["key"];

// Read by proxy.ts as well as the server, so it lives here rather than beside cookies().
export const PERSON_COOKIE = "japan-trip.person";

export const isPerson = (value: unknown): value is PersonKey => people.some((p) => p.key === value);
export const personName = (key: string) => people.find((p) => p.key === key)?.name ?? key;
export const personOf = (key: string) => people.find((p) => p.key === key);
