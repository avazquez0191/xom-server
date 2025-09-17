export const toOptional = (value: string): string | undefined =>
    value?.trim() || undefined;

export const toNumber = (value: string): number =>
    parseFloat(value) || 0;

export const toDate = (value: string): Date =>
    value ? new Date(value) : new Date();