# Cobberdog Essentials 🐾

One place for everything about our Australian Cobberdog puppy: the shopping list, research on vets and training courses, breed tips, and training progress.

It's an installable web app (PWA). It works offline on a phone, and it can sync between everyone in the household.

## What's inside

| Section | What it does |
|---|---|
| **Home** | Puppy profile, pickup-day countdown, shopping and training progress, chosen vet and course, the next essentials to buy |
| **Shopping** | About 40 pre-filled puppy items with priority and a tip for each. Tick off as bought, mark "don't need", record cost, store, link and notes |
| **Knowledge** | Research notes (breed facts, breeder questions, feeding, coat care, first 48 hours) plus **options**: vets, courses, groomers or insurers with pros, cons, rating, cost and a Chosen / Ruled out decision |
| **Training** | 16 skills with how-to steps and a status (Not started → Learning → Practising → Reliable), a session log, and a socialisation checklist with exposure counters |
| **Settings** | Household sync, JSON backup export/import, restore starter content |

All starter content can be edited or deleted. Health guidance is general, so confirm medical decisions with your vet.

## Run it locally

```bash
npm install
npm run dev
```

`npm test` runs the unit tests and `npm run build` produces a static site in `dist/`. You can host it anywhere: GitHub Pages, Netlify or Vercel.

## Household sync (optional, ~10 minutes)

Without sync, data stays on the device it was entered on. To share it:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it.
3. Under **Authentication → URL Configuration**, add the URL where the app is hosted to *Redirect URLs*, so the email sign-in links work.
4. Under **Project Settings → API**, copy the *Project URL* and the *anon public* key. Then do one of these:
   - put them in `.env.local` (see `.env.example`) before building, so nobody needs to type them, **or**
   - paste them into **Settings → Household sync** in the app on each device.
5. Sign in with your email (a magic link, no password) and **Create household**. Share the join code with your household. They sign in and **Join**.

How it works: every change is saved on the device first, then pushed to Supabase and streamed live to other members. If two people edit the *same* item, the most recent edit wins. Row Level Security means only household members can read or write its records.

## Project layout

```
src/
  data/seed.ts      starter content (shopping list, notes, skills, socialisation)
  lib/store.tsx     local-first store + sync engine
  lib/sync.ts       Supabase client (auth, households, records, realtime)
  lib/merge.ts      last-write-wins merge (unit tested)
  pages/            Home, Shopping, Knowledge, Training, Settings
supabase/schema.sql database schema + security policies
```
