import { getClient } from './sync';

export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  rating?: number;
  ratingCount?: number;
  mapsUri?: string;
}
export interface Review {
  rating: number;
  text: string;
  when: string;
  author: string;
  authorUri?: string;
  photoUri?: string;
  googleMapsUri?: string;
}
export interface PlaceDetails extends PlaceSummary {
  website?: string;
  phone?: string;
  hours: string[];
  reviews: Review[];
}
export interface SearchResult {
  origin: { lat: number; lng: number; label: string };
  places: PlaceSummary[];
}

/** Error codes the UI translates: signin-required, not-configured, postcode-not-found, bad-postcode, offline, google. */
export class PlacesError extends Error {}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const c = getClient();
  if (!c) throw new PlacesError('signin-required');
  const { data: s } = await c.auth.getSession();
  if (!s.session) throw new PlacesError('signin-required');
  if (!navigator.onLine) throw new PlacesError('offline');
  const { data, error } = await c.functions.invoke('places', { body });
  if (error) {
    // FunctionsHttpError carries the response; FunctionsFetchError / RelayError mean the function isn't reachable/deployed.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const payload = await ctx.json().catch(() => ({}));
      if (ctx.status === 404 && !payload.error) throw new PlacesError('not-configured');
      throw new PlacesError(payload.error ?? 'google');
    }
    throw new PlacesError('not-configured');
  }
  return data as T;
}

export const searchVets = (postcode: string, country: string, lang: string, radiusKm: number) =>
  call<SearchResult>({ action: 'search', postcode, country, lang, radiusKm });

// Session-only memory cache (Google's terms don't allow storing Places content).
const detailCache = new Map<string, Promise<PlaceDetails>>();
export function placeDetails(placeId: string, lang: string): Promise<PlaceDetails> {
  const key = `${placeId}:${lang}`;
  if (!detailCache.has(key)) {
    const p = call<PlaceDetails>({ action: 'details', placeId, lang });
    p.catch(() => detailCache.delete(key));
    detailCache.set(key, p);
  }
  return detailCache.get(key)!;
}

export const EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY as string | undefined;

/** Google Maps Embed API URL (free, no usage cost). Returns null when no browser key is configured. */
export function embedUrl(opts: { placeId?: string; query?: string; center?: { lat: number; lng: number }; zoom?: number }, lang: string): string | null {
  if (!EMBED_KEY) return null;
  const p = new URLSearchParams({ key: EMBED_KEY, language: lang === 'nb' ? 'no' : 'en' });
  if (opts.placeId) {
    p.set('q', `place_id:${opts.placeId}`);
    return `https://www.google.com/maps/embed/v1/place?${p}`;
  }
  p.set('q', opts.query ?? 'veterinary');
  if (opts.center) p.set('center', `${opts.center.lat},${opts.center.lng}`);
  if (opts.zoom) p.set('zoom', String(opts.zoom));
  return `https://www.google.com/maps/embed/v1/search?${p}`;
}

/** Works without any key: opens Google Maps (app or web). */
export const mapsSearchLink = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
export const mapsPlaceLink = (name: string, placeId: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
