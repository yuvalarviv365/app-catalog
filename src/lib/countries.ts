/**
 * Master list of countries to check during Play Store market detection.
 * Any country found available that isn't yet in the DB gets auto-created.
 */

export interface CountryInfo {
  code: string       // ISO 3166-1 alpha-2
  name: string
  region: "EMEA" | "LATAM" | "APAC" | "AMERICAS"
}

export const COUNTRIES: CountryInfo[] = [
  // EMEA — Europe
  { code: "AT", name: "Austria",         region: "EMEA" },
  { code: "BE", name: "Belgium",         region: "EMEA" },
  { code: "BG", name: "Bulgaria",        region: "EMEA" },
  { code: "HR", name: "Croatia",         region: "EMEA" },
  { code: "CY", name: "Cyprus",          region: "EMEA" },
  { code: "CZ", name: "Czech Republic",  region: "EMEA" },
  { code: "DK", name: "Denmark",         region: "EMEA" },
  { code: "EE", name: "Estonia",         region: "EMEA" },
  { code: "FI", name: "Finland",         region: "EMEA" },
  { code: "FR", name: "France",          region: "EMEA" },
  { code: "DE", name: "Germany",         region: "EMEA" },
  { code: "GR", name: "Greece",          region: "EMEA" },
  { code: "HU", name: "Hungary",         region: "EMEA" },
  { code: "IE", name: "Ireland",         region: "EMEA" },
  { code: "IT", name: "Italy",           region: "EMEA" },
  { code: "LV", name: "Latvia",          region: "EMEA" },
  { code: "LT", name: "Lithuania",       region: "EMEA" },
  { code: "LU", name: "Luxembourg",      region: "EMEA" },
  { code: "MT", name: "Malta",           region: "EMEA" },
  { code: "NL", name: "Netherlands",     region: "EMEA" },
  { code: "NO", name: "Norway",          region: "EMEA" },
  { code: "PL", name: "Poland",          region: "EMEA" },
  { code: "PT", name: "Portugal",        region: "EMEA" },
  { code: "RO", name: "Romania",         region: "EMEA" },
  { code: "SK", name: "Slovakia",        region: "EMEA" },
  { code: "SI", name: "Slovenia",        region: "EMEA" },
  { code: "ES", name: "Spain",           region: "EMEA" },
  { code: "SE", name: "Sweden",          region: "EMEA" },
  { code: "CH", name: "Switzerland",     region: "EMEA" },
  { code: "GB", name: "United Kingdom",  region: "EMEA" },
  // EMEA — Africa & Middle East
  { code: "ZA", name: "South Africa",    region: "EMEA" },
  { code: "NG", name: "Nigeria",         region: "EMEA" },
  { code: "KE", name: "Kenya",           region: "EMEA" },
  { code: "GH", name: "Ghana",           region: "EMEA" },
  { code: "TZ", name: "Tanzania",        region: "EMEA" },
  // LATAM
  { code: "AR", name: "Argentina",       region: "LATAM" },
  { code: "BO", name: "Bolivia",         region: "LATAM" },
  { code: "BR", name: "Brazil",          region: "LATAM" },
  { code: "CL", name: "Chile",           region: "LATAM" },
  { code: "CO", name: "Colombia",        region: "LATAM" },
  { code: "CR", name: "Costa Rica",      region: "LATAM" },
  { code: "EC", name: "Ecuador",         region: "LATAM" },
  { code: "GT", name: "Guatemala",       region: "LATAM" },
  { code: "MX", name: "Mexico",          region: "LATAM" },
  { code: "PA", name: "Panama",          region: "LATAM" },
  { code: "PY", name: "Paraguay",        region: "LATAM" },
  { code: "PE", name: "Peru",            region: "LATAM" },
  { code: "UY", name: "Uruguay",         region: "LATAM" },
  { code: "VE", name: "Venezuela",       region: "LATAM" },
  // APAC
  { code: "AU", name: "Australia",       region: "APAC" },
  { code: "BD", name: "Bangladesh",      region: "APAC" },
  { code: "IN", name: "India",           region: "APAC" },
  { code: "ID", name: "Indonesia",       region: "APAC" },
  { code: "JP", name: "Japan",           region: "APAC" },
  { code: "MY", name: "Malaysia",        region: "APAC" },
  { code: "NZ", name: "New Zealand",     region: "APAC" },
  { code: "PH", name: "Philippines",     region: "APAC" },
  { code: "SG", name: "Singapore",       region: "APAC" },
  { code: "KR", name: "South Korea",     region: "APAC" },
  { code: "TH", name: "Thailand",        region: "APAC" },
  { code: "VN", name: "Vietnam",         region: "APAC" },
  // AMERICAS
  { code: "CA", name: "Canada",          region: "AMERICAS" },
  { code: "US", name: "United States",   region: "AMERICAS" },
]

/** Converts a 2-letter country code to a flag emoji. */
export function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("")
}
