// src/utils/locationUtils.js
import { City, State, Country } from "country-state-city";

// Common abbreviations mapping
export const locationAbbreviations = {
  // US States
  al: "alabama",
  ak: "alaska",
  az: "arizona",
  ar: "arkansas",
  ca: "california",
  co: "colorado",
  ct: "connecticut",
  de: "delaware",
  fl: "florida",
  ga: "georgia",
  hi: "hawaii",
  id: "idaho",
  il: "illinois",
  in: "indiana",
  ia: "iowa",
  ks: "kansas",
  ky: "kentucky",
  la: "louisiana",
  me: "maine",
  md: "maryland",
  ma: "massachusetts",
  mi: "michigan",
  mn: "minnesota",
  ms: "mississippi",
  mo: "missouri",
  mt: "montana",
  ne: "nebraska",
  nv: "nevada",
  nh: "new hampshire",
  nj: "new jersey",
  nm: "new mexico",
  ny: "new york",
  nc: "north carolina",
  nd: "north dakota",
  oh: "ohio",
  ok: "oklahoma",
  or: "oregon",
  pa: "pennsylvania",
  ri: "rhode island",
  sc: "south carolina",
  sd: "south dakota",
  tn: "tennessee",
  tx: "texas",
  ut: "utah",
  vt: "vermont",
  va: "virginia",
  wa: "washington",
  wv: "west virginia",
  wi: "wisconsin",
  wy: "wyoming",
  dc: "district of columbia",

  // Country abbreviations
  us: "united states",
  usa: "united states",
  "u.s.": "united states",
  "u.s.a.": "united states",
  uk: "united kingdom",
  "u.k.": "united kingdom",
  gb: "great britain",
  "g.b.": "great britain",
  uae: "united arab emirates",
  "u.a.e.": "united arab emirates",
  ca: "canada",
  au: "australia",
  de: "germany",
  fr: "france",
  it: "italy",
  es: "spain",
  pt: "portugal",
  nl: "netherlands",
  be: "belgium",
  ch: "switzerland",
  se: "sweden",
  no: "norway",
  dk: "denmark",
  fi: "finland",
  pl: "poland",
  cz: "czech republic",
  at: "austria",
  hu: "hungary",
  ro: "romania",
  bg: "bulgaria",
  gr: "greece",
  tr: "turkey",
  ru: "russia",
  ua: "ukraine",
  il: "israel",
  sa: "saudi arabia",
  ae: "united arab emirates",
  eg: "egypt",
  za: "south africa",
  ng: "nigeria",
  gh: "ghana",
  ke: "kenya",
  et: "ethiopia",
  tz: "tanzania",
  ug: "uganda",
  mw: "malawi",
  zm: "zambia",
  zw: "zimbabwe",
  bw: "botswana",
  na: "namibia",
  mz: "mozambique",
  ao: "angola",
  cm: "cameroon",
  ci: "ivory coast",
  sn: "senegal",
  ml: "mali",
  ne: "niger",
  td: "chad",
  sd: "sudan",
};

// Normalize location string
export const normalizeLocation = (location) => {
  if (!location) return "";

  return location
    .toLowerCase()
    .trim()
    .replace(/[^\w\s,]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
};

// Expand abbreviations in location
export const expandAbbreviations = (location) => {
  const normalized = normalizeLocation(location);
  const parts = normalized.split(",").map((part) => part.trim());

  return parts
    .map((part) => {
      const cleanPart = part.replace(/\./g, "").toLowerCase();
      return locationAbbreviations[cleanPart] || part;
    })
    .join(", ");
};

// Extract location hierarchy and return match score
export const extractLocationHierarchy = (searchLocation, profileLocation) => {
  if (!profileLocation) return 0;

  const searchNormalized = normalizeLocation(
    expandAbbreviations(searchLocation)
  );
  const profileNormalized = normalizeLocation(
    expandAbbreviations(profileLocation)
  );

  const searchParts = searchNormalized
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part);
  const profileParts = profileNormalized
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part);

  // Exact match
  if (searchNormalized === profileNormalized) {
    return 100;
  }

  // City match (first part)
  if (searchParts[0] && profileParts[0] && searchParts[0] === profileParts[0]) {
    return 80;
  }

  // State match (check if any search part matches any profile state)
  for (let i = 1; i < searchParts.length; i++) {
    for (let j = 1; j < profileParts.length; j++) {
      if (searchParts[i] === profileParts[j]) {
        return 60;
      }
    }
  }

  // Country match
  const searchCountry = searchParts[searchParts.length - 1];
  const profileCountry = profileParts[profileParts.length - 1];
  if (searchCountry && profileCountry && searchCountry === profileCountry) {
    return 40;
  }

  // Partial matches (contains)
  for (const searchPart of searchParts) {
    for (const profilePart of profileParts) {
      if (
        profilePart.includes(searchPart) ||
        searchPart.includes(profilePart)
      ) {
        return 20;
      }
    }
  }

  return 0;
};

// Get fallback locations for a search
export const getFallbackLocations = (searchLocation) => {
  const normalized = normalizeLocation(expandAbbreviations(searchLocation));
  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part);

  const fallbacks = [];

  if (parts.length >= 3) {
    // City, State, Country -> try State, Country
    fallbacks.push(parts.slice(1).join(", "));
  }

  if (parts.length >= 2) {
    // City, State or State, Country -> try Country
    fallbacks.push(parts[parts.length - 1]);
  }

  // Remove duplicates and return
  return [...new Set(fallbacks)];
};
