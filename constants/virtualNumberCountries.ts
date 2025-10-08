// Minimal list of countries supported for Virtual Numbers with ISO codes and flags
// Extend this list as your backend supports more countries
export interface VnCountry {
  code: string; // ISO 3166-1 alpha-2, lowercase preferred for API
  name: string;
  flag: string; // emoji flag
}

export const VIRTUAL_NUMBER_COUNTRIES: VnCountry[] = [
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'gh', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
];

export type Country = VnCountry;

// Internal map for known exceptions where backend slug differs from naive slug
// Add here only if backend uses a different canonical slug than simple slugify(name)
const EXPLICIT_COUNTRY_SLUGS: Record<string, string> = {
  // ISO code -> backend slug
  ng: 'nigeria',
  us: 'united-states',
  gb: 'united-kingdom',
  gh: 'ghana',
  ke: 'kenya',
  ca: 'canada',
  in: 'india',
};

/**
 * Convert an arbitrary country display name to a URL-safe slug that matches backend expectation.
 * Rules:
 *  - Lowercase
 *  - Trim whitespace
 *  - Replace '&' with 'and'
 *  - Remove apostrophes and diacritics
 *  - Collapse any non-alphanumeric (a-z0-9) sequences into single hyphen
 *  - Trim leading/trailing hyphens
 */
export function slugifyCountryName(name: string): string {
  return name
    .normalize('NFD') // separate diacritics
    .replace(/\p{Diacritic}+/gu, '') // remove diacritics
    .replace(/&/g, ' and ') // & -> and
    .replace(/['’`]/g, '') // remove apostrophes/quotes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
    .replace(/-{2,}/g, '-'); // collapse repeats
}

/**
 * Get backend slug for a virtual number country. Prefers explicit mapping (stable even if display name changes),
 * then falls back to slugified country name.
 */
export function getVirtualNumberCountrySlug(country: Country): string {
  return country.code || slugifyCountryName(country.name);
}

