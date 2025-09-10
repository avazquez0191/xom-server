import { TEMU_COLUMNS } from './temu/columns';

// Add to Platform type
type Platform = 'temu' | 'amazon' | 'ebay' | false;

// Flatten & Normalize all possible Temu column names into a single array
const FLATTENED_TEMU_HEADERS = flattenColumnNames(TEMU_COLUMNS).map(h => h.toLowerCase());

export function detectPlatform(headers: string[]): Platform {
    if (!headers?.length) return false;

    // Normalize provided header set for comparison
    const providedHeaders = new Set(headers.map(h => h.toLowerCase().trim()));

    // Calculate match percentage (against total possible Temu headers)
    const matchTemuCount = FLATTENED_TEMU_HEADERS.filter(h => providedHeaders.has(h)).length;
    const matchTemuPercentage = (matchTemuCount / FLATTENED_TEMU_HEADERS.length) * 100;

    if (matchTemuPercentage >= 90)
        return 'temu';
    else
        return false;
}

// Helper function to flatten nested column structure
function flattenColumnNames(columns: any): string[] {
    const result: string[] = [];

    for (const key in columns) {
        if (Array.isArray(columns[key])) {
            // Handle array values (e.g., ['order id'])
            result.push(...columns[key]);
        } else if (typeof columns[key] === 'object') {
            // Recursively handle nested objects
            result.push(...flattenColumnNames(columns[key]));
        }
    }

    return result;
}

// Update getPlatformMapper()
export function getPlatformMapper(platform: Platform) {
    switch (platform) {
        case 'temu': return new (require('./temu/mapper').TemuMapper)();
        // ... other cases
    }
}