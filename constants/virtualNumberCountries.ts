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
