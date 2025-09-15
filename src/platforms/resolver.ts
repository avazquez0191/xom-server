import { TEMU_COLUMNS } from './temu/columns';
import { EBAY_COLUMNS } from './ebay/columns';
import { AMAZON_COLUMNS } from './amazon/columns';
import { Platform } from '@models/common.model';

// Precompute flattened headers for each platform
const PLATFORM_HEADERS = {
  temu: flattenColumnNames(TEMU_COLUMNS).map(h => h.toLowerCase()),
  ebay: flattenColumnNames(EBAY_COLUMNS).map(h => h.toLowerCase()),
  amazon: flattenColumnNames(AMAZON_COLUMNS).map(h => h.toLowerCase())
};

// UNUSED - Filename-based detection
export function detectPlatformByHeaders(headers: string[]): Platform {
  if (!headers?.length) return false;

  const providedHeaders = new Set(headers.map(h => h.toLowerCase().trim()));

  for (const [platform, platformHeaders] of Object.entries(PLATFORM_HEADERS)) {
    const matchCount = platformHeaders.filter(h => providedHeaders.has(h)).length;
    const matchPercentage = (matchCount / platformHeaders.length) * 100;

    if (matchPercentage >= 90) return platform as Platform;
  }

  return false;
}

export function detectPlatform(platform: string): Platform {
  const toLower = platform.toLowerCase();
  if (toLower.includes('temu')) return 'temu';
  if (toLower.includes('ebay')) return 'ebay';
  if (toLower.includes('amazon')) return 'amazon';
  return false;
}

export function getPlatformMapper(platform: Platform) {
  switch (platform) {
    case 'temu': return new (require('./temu/mapper').TemuMapper)();
    case 'ebay': return new (require('./ebay/mapper').EbayMapper)();
    case 'amazon': return new (require('./amazon/mapper').AmazonMapper)();
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