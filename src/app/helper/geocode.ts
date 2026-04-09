import axios from 'axios';

/** First 5 digits for US ZIP / ZIP+4; null if fewer than 5 digits. */
export const normalizeUsZip = (raw: string): string | null => {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 5) return digits.slice(0, 5);
  return null;
};

const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT ||
  'JessYamamoto/1.0 (stripe-registration; contact: support@jetsetcare.app)';

async function nominatimSearch(params: Record<string, string | number>) {
  const response = await axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        format: 'json',
        limit: 1,
        addressdetails: 1,
        ...params,
      },
      headers: {
        'User-Agent': NOMINATIM_UA,
      },
      timeout: 12_000,
    },
  );
  return response.data as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
}

export const getLocationFromZip = async (zip: string) => {
  const trimmed = String(zip).trim();
  if (!trimmed) return null;

  const usZip = normalizeUsZip(trimmed);

  try {
    let rows = await nominatimSearch(
      usZip
        ? { postalcode: usZip, country: 'us' }
        : { q: trimmed },
    );

    if (!rows?.length && usZip) {
      rows = await nominatimSearch({ q: `${usZip}, United States` });
    }

    if (!rows?.length) return null;

    const result = rows[0]!;
    return {
      lat: Number(result.lat),
      lng: Number(result.lon),
      location: result.display_name,
    };
  } catch (error) {
    console.warn('[geocode] getLocationFromZip failed:', error);
    return null;
  }
};
