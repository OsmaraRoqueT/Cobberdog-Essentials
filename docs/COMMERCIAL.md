# Commercialisation notes

What's needed to turn this from a household app into a product people pay for, in rough order.

## 1. One hosted backend for all customers (blocker)
Today each household must create its own Supabase project, which no paying customer will do. Instead, run **one** Supabase project (EU region) and bake its URL and key into the build. The schema already isolates households with Row Level Security, so customers can't see each other's data. Before launch:
- Review the RLS policies and add rate limiting on the `join_household` function so join codes can't be guessed.
- Add account deletion and data export for GDPR (backup export exists; server-side deletion does not).
- Write a privacy policy and a data processing agreement with Supabase.

## 2. GDPR / Norwegian requirements
You would be the data controller for customer data: email addresses and household records. Free-text notes may contain health information about the *dog*, which is not personal data, but owners' names and addresses can slip in. Keep data in the EU/EEA, document retention, and keep the "not veterinary advice" disclaimer visible (it's on Health and Settings).

## 3. Push notifications (later phase)
Calendar export covers reminders today. For real push: Web Push with VAPID keys, a scheduled Supabase Edge Function that sends due reminders, and a store of subscriptions per device. On iOS, push works only for web apps added to the home screen (iOS 16.4+).

## 4. Payments
Options include a one-off purchase per household or a yearly subscription. For a PWA, Stripe Checkout plus a `subscriptions` table checked in RLS is the simplest route. Selling through the App Store or Google Play means wrapping the app (e.g. with Capacitor) and paying the store's commission.

## 5. Content quality
Country and breed text are general guidance. Before selling in a country, have a local vet review that country's pack and the vaccination schedule, and date-stamp the content. Breed packs are the main way to grow beyond Cobberdog: each new breed is mostly content, not code.

## 6. Shared clinic database (future, a reason to pay)
Today each household phones its clinics and records direct settlement, emergency cover and handling privately, stamped with the date checked (`checkedOn`). Once there are enough users, pool these answers:
- A `clinic_facts` table keyed by Google place id and insurer, with each household's answer and date. Show "Direct settlement with Tryg: confirmed by 7 owners, last 3 weeks ago".
- Only share answers the owner opts in to share. Never share household names or emails.
- Expire or flag answers older than about 12 months, because clinics change agreements.
- Ask clinics to confirm or correct their own entries. That's a natural channel for a later B2B offer.

## 7. Name and brand
The header shows "Cobberdog Essentials" for Cobberdog owners and a generic name otherwise ("Puppy Essentials" / "Valpeappen"). Pick a real brand name and check trademarks and domains before launch.
