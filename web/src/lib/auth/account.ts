import 'server-only';

// XPR account names: 1-12 characters, a-z, 1-5 and dots.
export const ACCOUNT_NAME_PATTERN = /^[a-z1-5.]{1,12}$/;

export function isValidAccountName(value: unknown): value is string {
    return typeof value === 'string' && ACCOUNT_NAME_PATTERN.test(value);
}
