export const toOptional = (value: string): string | undefined =>
    value?.trim() || undefined;

export const toNumber = (value: string): number =>
    parseFloat(value) || 0;

export const toDate = (value: string): Date =>
    value ? new Date(value) : new Date();

export const roundToHalf = (num: number): number => {
    // Divide by 2
    const half = num / 2;
    // Round to nearest 0.5
    return Math.round(half * 2) / 2;
};

export const getStateCode = (state: string): string => {
  const states: Record<string, string> = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
    "District of Columbia": "DC"
  };

  const normalized = state.trim().toLowerCase();

  // ✅ If already a 2-letter code, just return uppercased
  const allCodes = new Set(Object.values(states));
  if (normalized.length === 2 && allCodes.has(normalized.toUpperCase())) {
    return normalized.toUpperCase();
  }

  // ✅ Otherwise, match by full name
  for (const [name, code] of Object.entries(states)) {
    if (name.toLowerCase() === normalized) {
      return code;
    }
  }

  return state; // Not found
}