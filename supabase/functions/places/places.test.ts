import { describe, expect, it } from 'vitest';
import { distanceKm, handle } from './index';

const env = { googleKey: 'test-key', supabaseUrl: 'https://proj.supabase.co' };
const req = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer user-jwt', apikey: 'pub' }) =>
  new Request('https://fn/places', { method: 'POST', headers, body: JSON.stringify(body) });

type Call = { url: string; init?: RequestInit };
function fakeFetch(routes: (url: string, init?: RequestInit) => { status?: number; body: unknown }) {
  const calls: Call[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const r = routes(String(url), init);
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { f, calls };
}

const okAuth = (url: string) => (url.endsWith('/auth/v1/user') ? { body: { id: 'u1' } } : null);

describe('places edge function', () => {
  it('rejects callers who are not signed in, without calling Google', async () => {
    const { f, calls } = fakeFetch((url) => (url.endsWith('/auth/v1/user') ? { status: 401, body: {} } : { body: {} }));
    const res = await handle(req({ action: 'search', postcode: '0150' }), env, f);
    expect(res.status).toBe(401);
    expect(calls.some((c) => c.url.includes('googleapis'))).toBe(false);
  });

  it('reports when the Google key is missing', async () => {
    const res = await handle(req({ action: 'search' }), { supabaseUrl: env.supabaseUrl }, fetch);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not-configured' });
  });

  it('geocodes the post code and searches vets nearest-first', async () => {
    const { f, calls } = fakeFetch((url) => {
      const a = okAuth(url);
      if (a) return a;
      if (url.includes('geocode')) return { body: { results: [{ geometry: { location: { lat: 59.91, lng: 10.75 } }, formatted_address: '0150 Oslo, Norway' }] } };
      return {
        body: {
          places: [
            { id: 'A1', displayName: { text: 'Oslo Dyreklinikk' }, formattedAddress: 'Gate 1', location: { latitude: 59.92, longitude: 10.75 }, rating: 4.7, userRatingCount: 210 },
            { id: 'B2', displayName: { text: 'Closed Vet' }, location: { latitude: 59.9, longitude: 10.7 }, businessStatus: 'CLOSED_PERMANENTLY' },
          ],
        },
      };
    });
    const res = await handle(req({ action: 'search', postcode: '0150', country: 'NO', lang: 'nb', radiusKm: 10 }), env, f);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.origin.label).toBe('0150 Oslo, Norway');
    expect(data.places).toHaveLength(1);
    expect(data.places[0]).toMatchObject({ id: 'A1', name: 'Oslo Dyreklinikk', rating: 4.7, ratingCount: 210, distanceKm: 1.1 });

    const geo = calls.find((c) => c.url.includes('geocode'))!;
    expect(decodeURIComponent(geo.url)).toContain('components=postal_code:0150|country:NO');
    const nearby = calls.find((c) => c.url.includes('searchNearby'))!;
    const sent = JSON.parse(String(nearby.init!.body));
    expect(sent).toMatchObject({ includedTypes: ['veterinary_care'], rankPreference: 'DISTANCE', languageCode: 'no' });
    expect(sent.locationRestriction.circle.radius).toBe(10000);
    expect((nearby.init!.headers as Record<string, string>)['X-Goog-FieldMask']).toContain('places.rating');
  });

  it('returns 404 for an unknown post code and 400 for nonsense input', async () => {
    const { f } = fakeFetch((url) => okAuth(url) ?? { body: { results: [] } });
    expect((await handle(req({ action: 'search', postcode: '9999' }), env, f)).status).toBe(404);
    expect((await handle(req({ action: 'search', postcode: '<script>' }), env, f)).status).toBe(400);
  });

  it('maps place details and reviews', async () => {
    const { f, calls } = fakeFetch((url) =>
      okAuth(url) ?? {
        body: {
          id: 'A1',
          displayName: { text: 'Oslo Dyreklinikk' },
          websiteUri: 'https://vet.example',
          nationalPhoneNumber: '22 00 00 00',
          regularOpeningHours: { weekdayDescriptions: ['mandag: 08–20'] },
          rating: 4.7,
          userRatingCount: 210,
          reviews: [{ rating: 5, text: { text: 'Fantastisk!' }, relativePublishTimeDescription: 'for 2 uker siden', authorAttribution: { displayName: 'Kari' } }],
        },
      },
    );
    const data = await (await handle(req({ action: 'details', placeId: 'ChIJabcdefghijk', lang: 'nb' }), env, f)).json();
    expect(data).toMatchObject({ website: 'https://vet.example', phone: '22 00 00 00', hours: ['mandag: 08–20'] });
    expect(data.reviews[0]).toMatchObject({ rating: 5, text: 'Fantastisk!', author: 'Kari', when: 'for 2 uker siden' });
    expect(calls.at(-1)!.url).toContain('places/ChIJabcdefghijk?languageCode=no');
  });

  it('computes distances', () => {
    expect(distanceKm({ lat: 59.91, lng: 10.75 }, { lat: 60.39, lng: 5.32 })).toBeGreaterThan(300);
  });
});
