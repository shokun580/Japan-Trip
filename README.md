# Osaka Trip Planner

Mobile-first itinerary companion built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and Neon PostgreSQL.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set your Neon `DATABASE_URL`.
3. Create the schema: `npm run db:push`
4. Load the example trip: `npm run db:seed`
5. Start: `npm run dev`

Without `DATABASE_URL`, the app runs with read-only demo data so the UI can be previewed safely.

The interface self-hosts the official LINE Seed Sans TH webfont files. LINE Seed is released by LY Corporation under the SIL Open Font License 1.1.

## Deploy to Vercel

Import this repository, add `DATABASE_URL` in Vercel project settings, then deploy. The build runs `prisma generate` automatically. Run `npm run db:push` and `npm run db:seed` against the production database once before first use.
