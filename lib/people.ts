// No login: the checklist is split by these keys alone, and the phone remembers
// which one it belongs to. Keys are stored in the database, so never rename one —
// add a new entry instead, or the rows behind it are orphaned.
export const people = [
  { key: "shokun", name: "โชกุน" },
  { key: "may", name: "เมย์" },
  { key: "mom-shokun", name: "แม่โชกุน" },
  { key: "mom-may", name: "แม่เมย์" },
  { key: "porsche", name: "พอร์ช" },
  { key: "oak", name: "โอ๊ค" },
  { key: "chanon", name: "ชานนท์" },
] as const;

export type PersonKey = (typeof people)[number]["key"];

export const isPerson = (value: unknown): value is PersonKey => people.some((p) => p.key === value);
export const personName = (key: string) => people.find((p) => p.key === key)?.name ?? key;
