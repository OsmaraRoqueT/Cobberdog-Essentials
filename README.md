# Puppy Essentials (Cobberdog Essentials) 🐾

One place for everything about a new puppy: shopping list, research on vets and courses, breed tips, training progress, health log and reminders.

It's an installable web app (PWA) that works offline on phones and tablets and can sync between everyone in a household. It's built to be sold as a product: the interface is in **English and Norwegian (bokmål)**, owners choose their **country** and **breed** on first launch, and starter content adapts to both.

## What's inside

| Section | What it does |
|---|---|
| **Home** | Puppy profile and pickup countdown, upcoming reminders, shopping and training progress, chosen vet and course, the next essentials to buy |
| **Health** | Vaccinations, worming, flea/tick, vet visits, grooming, medication and weight. Includes a **suggested schedule** built from birth and pickup dates and the country's seasonal rules, plus repeating reminders and **Add to calendar** (phone `.ics` or Google Calendar) |
| **Shopping** | Puppy items with priorities and tips. Country admin items (e.g. Dyreidentitet in Norway) and breed items are added automatically |
| **Training** | 16 skills with how-to steps and a status, a session log, and a socialisation checklist |
| **Knowledge** | Research notes plus **options** for comparing vets, courses and insurers (pros, cons, rating, Chosen / Ruled out) |
| **Settings** | Language (per device), country, breed and currency (per household), a keep-screen-on mode for wall/kitchen tablets, household sync, and backup |

On screens 900px and wider (tablets, desktops) the layout switches to a side menu with a two-column dashboard.

Health guidance is general and every screen says so: confirm medical decisions with a vet.

## Reminders: how they reach you

Reminders are added to the **phone's own calendar**, either as an `.ics` file (iPhone, iPad, Mac, Outlook and most Android phones) or as a Google Calendar link. Each event has an alert at 09:00 the day before. This works on every device with no server, and alerts arrive even if the app is never opened.

Real push notifications are planned for a later phase. They need a hosted backend that sends them on a schedule, and on iPhone they only work after the app is added to the home screen. See [docs/COMMERCIAL.md](docs/COMMERCIAL.md).

## Run it

```bash
npm install
npm run dev
```

`npm test` runs the unit tests. `npm run build` produces a static site in `dist/` that can be hosted anywhere.

## Household sync: one tablet plus phones

Without sync, data stays on the device. To share it between a household tablet and phones:

1. Create a free project at [supabase.com](https://supabase.com). Pick an **EU region** for European users.
2. Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it.
3. Under **Authentication → URL Configuration**, add the hosted app URL to *Redirect URLs*.
4. Under **Project Settings → API**, copy the *Project URL* and the *publishable* key into `.env.production` before building. This repo's `.env.production` already points at the household's project. Publishable keys are public by design; never commit a secret/service_role key.
5. On the **tablet**: complete the first-run setup, then go to **Settings**, sign in with email (magic link) and choose **Create household**. Note the join code.
6. On each **phone**: on the first screen tap **Join a household**, sign in, and enter the join code. The puppy, country and breed come from the household.

Every change is saved on the device first and then synced live. If two people edit the same item, the most recent edit wins.

## Content packs

Starter content is assembled from packs in `src/content/`:

- `generic.ts`: breed- and country-neutral puppy content
- `countries.ts`: currency, local registration and rules, and seasonal reminders (NO, SE, DK, FI, GB, US, AU, plus "Other")
- `breeds.ts`: breed packs (Australian Cobberdog, plus "Other / mixed")

To add a breed or country, add a pack. Text is `{ en, nb }`, and English is the fallback. Untouched starter items follow the device language. Items you've edited keep the text they had.

UI strings live in `src/i18n/en.ts` and `nb.ts`. TypeScript and a test make sure every key is translated.
