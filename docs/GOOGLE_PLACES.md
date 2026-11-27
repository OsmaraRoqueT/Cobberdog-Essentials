# Optional upgrade: in-app clinic search (Google Places)

**Not in use.** The app's vet finder uses the free "Search in Google Maps" link, and owners add the clinics they want to compare. Everything below is only needed to show clinics, reviews and maps *inside* the app. That needs a Google Cloud account with billing and is switched off by default.

To switch it on later, follow these steps, then add `VITE_PLACES_ENABLED=true` to `.env.production`.

The vet finder uses Google Maps Platform. Two keys keep the bill and the risk under control:

| Key | Used for | Where it lives | Cost |
|---|---|---|---|
| **Server key** | Places API (New) + Geocoding API: clinic search, website, phone, hours, reviews | Supabase secret, never in the app | Free monthly allowance per API; a household uses a tiny fraction |
| **Browser key** (optional) | Maps Embed API: the map shown in the app | `.env.production` (public, locked to your website) | Free, no usage charge |

Without the browser key, the finder still works and shows clinics as a list with "Open in Google Maps" links.

## 1. Google Cloud (≈10 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (e.g. "puppy-app") and **enable billing**. Google requires a card even within the free allowance.
2. **APIs & Services → Library**: enable **Places API (New)**, **Geocoding API** and **Maps Embed API**.
3. **APIs & Services → Credentials → Create credentials → API key**. Name it "server".
   - *API restrictions*: restrict to **Places API (New)** and **Geocoding API**.
   - *Application restrictions*: none (it's called from Supabase's servers, not a browser).
4. Create a second API key, "browser":
   - *API restrictions*: **Maps Embed API** only.
   - *Application restrictions*: **Websites**, add `https://osmararoquet.github.io/*`.
5. **Protect against surprise bills.** In **Quotas**, cap Places API (New) and Geocoding API requests per day (e.g. 300). Under **Billing → Budgets & alerts**, create a budget of e.g. 10 USD with email alerts.

## 2. Supabase (≈5 min)

1. **Edge Functions → Secrets → Add new secret**: name `GOOGLE_MAPS_API_KEY`, value = the **server** key.
2. **Edge Functions → Deploy a new function → Via editor**: name it `places`, replace the example code with the contents of [`supabase/functions/places/index.ts`](../supabase/functions/places/index.ts), and deploy.
3. Open the function's **Details/Settings** and turn **off** "Verify JWT with legacy secret". The function checks the signed-in user itself; the legacy check doesn't support the project's newer keys.

## 3. The app

Add the **browser** key to `.env.production` and publish (merge to `main`):

```
VITE_GOOGLE_MAPS_EMBED_KEY=AIza...
```

The browser key is public by design and only works for the Maps Embed API on your website. Never put the server key here.

## Google's rules this app follows

- Reviews, ratings and opening hours are **shown live** and never saved. Only the clinic's Google place ID is stored, which Google allows.
- Reviews are labelled "Reviews from Google", with the author's name and a link to Google Maps.
- When you evaluate a clinic, the app copies its website and phone number into your own notes, so they stay available offline. Before selling the app, have this checked against the current Google Maps Platform terms.
