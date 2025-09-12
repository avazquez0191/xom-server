import { TEMU_COLUMNS } from './temu/columns';
import { EBAY_COLUMNS } from './ebay/columns';

type Platform = 'temu' | 'ebay' | false;

// Precompute flattened headers for each platform
const PLATFORM_HEADERS = {
  temu: flattenColumnNames(TEMU_COLUMNS).map(h => h.toLowerCase()),
  ebay: flattenColumnNames(EBAY_COLUMNS).map(h => h.toLowerCase())
};

export function detectPlatform(headers: string[]): Platform {
  if (!headers?.length) return false;

  const providedHeaders = new Set(headers.map(h => h.toLowerCase().trim()));
  
  for (const [platform, platformHeaders] of Object.entries(PLATFORM_HEADERS)) {
    const matchCount = platformHeaders.filter(h => providedHeaders.has(h)).length;
    const matchPercentage = (matchCount / platformHeaders.length) * 100;
    
    if (matchPercentage >= 90) return platform as Platform;
  }
  
  return false;
}

export function detectPlatformByFilename(filename: string): Platform {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes('temu')) return 'temu';
  if (lowerFilename.includes('ebay')) return 'ebay';
  return false;
}

export function getPlatformMapper(platform: Platform) {
  switch (platform) {
    case 'temu': return new (require('./temu/mapper').TemuMapper)();
    case 'ebay': return new (require('./ebay/mapper').EbayMapper)();
    default: throw new Error(`Unsupported platform: ${platform}`);
  }
}

function flattenColumnNames(columns: any): string[] {
  const result: string[] = [];
  for (const key in columns) {
    if (Array.isArray(columns[key])) {
      result.push(...columns[key]);
    } else if (typeof columns[key] === 'object') {
      result.push(...flattenColumnNames(columns[key]));
    }
  }
  return result;
}