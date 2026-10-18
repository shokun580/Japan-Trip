# Osaka Trip Planner

Mobile-first itinerary companion built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and Neon PostgreSQL.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set your Neon `DATABASE_URL`.
3. Create the schema: `npm run db:push`
4. Load the example trip: `npm run db:seed`
5. Start: `npm run dev`

Without `DATABASE_URL`, the app runs with read-only demo data so the UI can be previewed safely.

## Who is using the app

Opening any page first asks who you are (`/login`). Picking a name from
`lib/people.ts` sets a cookie for a year; `proxy.ts` sends anyone without it back to
the picker. For most people there is no password — it only tells each page whose
checklist and hotel to show. Switch person from the top-right menu.

โชกุน (`OWNER` in `lib/people.ts`) is the only one who can change the trip: the
`/manage` pages and every action in `app/actions.ts` refuse anyone else. Picking
โชกุน asks for a 6-digit PIN, and their cookie is signed so it cannot be typed in by
hand. Both values live in environment variables, never in this public repo:

- `OWNER_PIN` — the PIN. Changing it signs out every phone that used the old one.
- `SESSION_SECRET` — signs the cookie. Generate with `openssl rand -base64 32`.

Set them in Vercel (Production) and in your local `.env`, then redeploy.

## Hotels

The trip has one shared hotel (`/manage/stay`). Anyone with a row in `PersonStay`
sees their own hotel instead, editable on the same page.

## Packing checklist

Each traveller in `lib/people.ts` gets their own checklist, stored in the database.
The first visit copies the starter list from `lib/packing-defaults.ts` into that
person's own rows.

Adding models means the schema changed, so run `npm run db:push` against the
production database after deploying, or the checklist page will report that its
tables are missing.

The interface self-hosts the official LINE Seed Sans TH webfont files. LINE Seed is released by LY Corporation under the SIL Open Font License 1.1.

## Deploy to Vercel

Import this repository, add `DATABASE_URL` in Vercel project settings, then deploy. The build runs `prisma generate` automatically. Run `npm run db:push` and `npm run db:seed` against the production database once before first use.
