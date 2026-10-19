// Name values stay in this browser; only an opaque reference enters the URL.
export const NAME_ENTRY_PREFIX = 'myememorialNameEntry:';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export function readNameEntry(token: string | null): { firstName: string; lastName: string } | null {
  if (!token || !/^[a-f0-9-]{36}$/i.test(token)) return null;
  try {
    const value = JSON.parse(localStorage.getItem(NAME_ENTRY_PREFIX + token) || 'null');
    if (!value || !Number.isFinite(value.createdAt) || Date.now() - value.createdAt > MAX_AGE || value.createdAt > Date.now()) return null;
    if (typeof value.firstName !== 'string' || typeof value.lastName !== 'string') return null;
    const firstName = value.firstName.trim().slice(0, 100);
    const lastName = value.lastName.trim().slice(0, 100);
    return firstName && lastName ? { firstName, lastName } : null;
  } catch { return null; }
}
