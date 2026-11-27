/**
 * Supabase Edge Function "places": a thin, authenticated proxy to Google Maps Platform.
 *
 * Why a proxy: the Google key must not ship in the browser (anyone could run up the bill).
 * Only signed-in users of this project can call it.
 *
 *   POST { action: 'search', postcode, country, lang, radiusKm }  -> nearest vet clinics
 *   POST { action: 'details', placeId, lang }                     -> website, phone, hours, reviews
 *
 * Secret required (Supabase → Edge Functions → Secrets): GOOGLE_MAPS_API_KEY
 * Google APIs to enable on that key: Places API (New), Geocoding API.
 *
 * Google Maps Platform terms: Places content (reviews, ratings, hours) must not be stored;
 * the app keeps only the place id and shows this content live, with Google attribution.
 */

type Env = { googleKey?: string; supabaseUrl?: string };
type Fetch = typeof fetch;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.businessStatus',
].join(',');

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'regularOpeningHours.weekdayDescriptions',
  'rating',
  'userRatingCount',
  'reviews',
  'googleMapsUri',
].join(',');

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** Verify the caller is a signed-in user of this Supabase project. */
async function authorised(req: Request, env: Env, f: Fetch): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  const apikey = req.headers.get('apikey') ?? '';
  if (!auth.startsWith('Bearer ') || !env.supabaseUrl) return false;
  const res = await f(`${env.supabaseUrl}/auth/v1/user`, { headers: { Authorization: auth, apikey } });
  return res.ok;
}

async function geocode(postcode: string, country: string, lang: string, env: Env, f: Fetch) {
  const comps = [`postal_code:${postcode}`, country && country !== 'XX' ? `country:${country}` : ''].filter(Boolean).join('|');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?components=${encodeURIComponent(comps)}&language=${lang}&key=${env.googleKey}`;
  const res = await f(url);
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) return null;
  return { lat: hit.geometry.location.lat as number, lng: hit.geometry.location.lng as number, label: hit.formatted_address as string };
}

export async function search(body: Record<string, unknown>, env: Env, f: Fetch) {
  const postcode = String(body.postcode ?? '').trim();
  const country = String(body.country ?? '').toUpperCase();
  const lang = String(body.lang ?? 'en') === 'nb' ? 'no' : 'en';
  const radiusKm = Math.min(Math.max(Number(body.radiusKm) || 10, 1), 50);
  if (!/^[A-Za-z0-9 -]{2,10}$/.test(postcode)) return json({ error: 'bad-postcode' }, 400);

  const origin = await geocode(postcode, country, lang, env, f);
  if (!origin) return json({ error: 'postcode-not-found' }, 404);

  const res = await f('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.googleKey!, 'X-Goog-FieldMask': SEARCH_FIELDS },
    body: JSON.stringify({
      includedTypes: ['veterinary_care'],
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      languageCode: lang,
      locationRestriction: { circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: radiusKm * 1000 } },
    }),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: 'google', detail: data.error?.message }, 502);

  // deno-lint-ignore no-explicit-any
  const places = (data.places ?? []).filter((p: any) => p.businessStatus !== 'CLOSED_PERMANENTLY').map((p: any) => ({
    id: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    distanceKm: distanceKm(origin, { lat: p.location?.latitude, lng: p.location?.longitude }),
    rating: p.rating,
    ratingCount: p.userRatingCount,
    mapsUri: p.googleMapsUri,
  }));
  return json({ origin, places });
}

export async function details(body: Record<string, unknown>, env: Env, f: Fetch) {
  const id = String(body.placeId ?? '');
  const lang = String(body.lang ?? 'en') === 'nb' ? 'no' : 'en';
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) return json({ error: 'bad-place' }, 400);
  const res = await f(`https://places.googleapis.com/v1/places/${id}?languageCode=${lang}`, {
    headers: { 'X-Goog-Api-Key': env.googleKey!, 'X-Goog-FieldMask': DETAIL_FIELDS },
  });
  const p = await res.json();
  if (!res.ok) return json({ error: 'google', detail: p.error?.message }, 502);
  return json({
    id: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    website: p.websiteUri,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
    hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
    rating: p.rating,
    ratingCount: p.userRatingCount,
    mapsUri: p.googleMapsUri,
    // deno-lint-ignore no-explicit-any
    reviews: (p.reviews ?? []).map((r: any) => ({
      rating: r.rating,
      text: r.text?.text ?? r.originalText?.text ?? '',
      when: r.relativePublishTimeDescription ?? '',
      author: r.authorAttribution?.displayName ?? '',
      authorUri: r.authorAttribution?.uri,
      photoUri: r.authorAttribution?.photoUri,
      googleMapsUri: r.googleMapsUri,
    })),
  });
}

export async function handle(req: Request, env: Env, f: Fetch = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env.googleKey) return json({ error: 'not-configured' }, 503);
  if (!(await authorised(req, env, f))) return json({ error: 'signin-required' }, 401);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  if (body.action === 'search') return search(body, env, f);
  if (body.action === 'details') return details(body, env, f);
  return json({ error: 'unknown-action' }, 400);
}

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
if (D?.serve) {
  D.serve((req: Request) => handle(req, { googleKey: D.env.get('GOOGLE_MAPS_API_KEY'), supabaseUrl: D.env.get('SUPABASE_URL') }));
}
