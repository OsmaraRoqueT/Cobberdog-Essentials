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
| **Knowledge** | Research notes plus **options** for comparing courses and more. **Vet finder**: post code → search in Google Maps, add the clinics you like (with their Google Maps link for reviews), then call each one: the card shows the open questions and a scorecard (direct settlement with your insurer, distance, emergency cover, calm handling). **Insurance comparison**: the insurers in your country, side by side on a 14-point checklist you fill in from their quotes |
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

### Hosting (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and publishes every push to `main` to **https://osmararoquet.github.io/Cobberdog-Essentials/**. One-time setup: in the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

## Household sync: one tablet plus phones

Without sync, data stays on the device. To share it between a household tablet and phones:

1. Create a free project at [supabase.com](https://supabase.com). Pick an **EU region** for European users.
2. Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it. (Projects set up with an earlier version also need [`supabase/002_grants.sql`](supabase/002_grants.sql).)
3. Under **Authentication → URL Configuration**, set *Site URL* to the hosted app and add `<app URL>/**` to *Redirect URLs*.
4. Under **Project Settings → API**, copy the *Project URL* and the *publishable* key into `.env.production` before building. This repo's `.env.production` already points at the household's project. Publishable keys are public by design; never commit a secret/service_role key.
5. On the **tablet**: complete the first-run setup, then go to **Settings → Create account** (email + password). Open the confirmation email in any browser, come back, **Sign in**, and choose **Create household**. Note the join code.
6. On each **phone**: on the first screen tap **Join a household**, create an account (or sign in), and enter the join code. The puppy, country and breed come from the household.

Sign-in uses email + password rather than magic links: on iPhone/iPad, links from email open in Safari, not in a home-screen app. The only emails are the one-time confirmation and password resets, and those can be opened in any browser.

Every change is saved on the device first and then synced live. If two people edit the same item, the most recent edit wins.

## Vet finder (Google Maps)

Free by default: the app opens a Google Maps search for vets near the post code, and owners add the clinics they want to compare. An in-app search with live reviews (Google Places, needs a Google Cloud billing account) is built but switched off; see [docs/GOOGLE_PLACES.md](docs/GOOGLE_PLACES.md) and `supabase/functions/places/`.

## Content packs

Starter content is assembled from packs in `src/content/`:

- `generic.ts`: breed- and country-neutral puppy content
- `countries.ts`: currency, local registration and rules, and seasonal reminders (NO, SE, DK, FI, GB, US, AU, plus "Other")
- `breeds.ts`: breed packs (Australian Cobberdog, plus "Other / mixed")

To add a breed or country, add a pack. Text is `{ en, nb }`, and English is the fallback. Untouched starter items follow the device language. Items you've edited keep the text they had.

UI strings live in `src/i18n/en.ts` and `nb.ts`. TypeScript and a test make sure every key is translated.
