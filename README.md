# Osaka Trip Planner

Mobile-first itinerary companion built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and Neon PostgreSQL.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set your Neon `DATABASE_URL`.
3. Create the schema: `npm run db:push`
4. Load the example trip: `npm run db:seed`
5. Start: `npm run dev`

Without `DATABASE_URL`, the app runs with read-only demo data so the UI can be previewed safely.

## Packing checklist

Each of the seven travellers in `lib/people.ts` gets their own checklist, stored in
the database. There is no login: the phone remembers who it belongs to in
localStorage, and the first visit copies the starter list from
`lib/packing-defaults.ts` into that person's own rows.

Adding models means the schema changed, so run `npm run db:push` against the
production database after deploying, or the checklist page will report that its
tables are missing.

The interface self-hosts the official LINE Seed Sans TH webfont files. LINE Seed is released by LY Corporation under the SIL Open Font License 1.1.

## Deploy to Vercel

Import this repository, add `DATABASE_URL` in Vercel project settings, then deploy. The build runs `prisma generate` automatically. Run `npm run db:push` and `npm run db:seed` against the production database once before first use.
