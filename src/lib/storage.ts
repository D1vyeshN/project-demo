import type {
  Item,
  Party,
  Invoice,
  StockMovement,
  Purchase,
  Payment,
  Return,
} from './types';
import { STORAGE_KEYS } from './constants';

export { STORAGE_KEYS };

type StorageMap = {
  [STORAGE_KEYS.ITEMS]: Item[];
  [STORAGE_KEYS.PARTIES]: Party[];
  [STORAGE_KEYS.INVOICES]: Invoice[];
  [STORAGE_KEYS.STOCK_MOVEMENTS]: StockMovement[];
  [STORAGE_KEYS.PURCHASES]: Purchase[];
  [STORAGE_KEYS.PAYMENTS]: Payment[];
  [STORAGE_KEYS.RETURNS]: Return[];
};

export function getStorage<K extends keyof StorageMap>(
  key: K,
  defaultValue: StorageMap[K]
): StorageMap[K] {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as StorageMap[K];
    } catch (parseErr) {
      console.error(
        `[storage] Corrupt JSON for key "${key}", resetting to default.`,
        parseErr
      );
      // Attempt recovery: remove corrupt key so app can continue
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore removal failure
      }
      return defaultValue;
    }
  } catch (err) {
    console.error(`[storage] Unexpected error reading key "${key}":`, err);
    return defaultValue;
  }
}

export function setStorage<K extends keyof StorageMap>(
  key: K,
  value: StorageMap[K]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota or private mode — silently ignore
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch {
    // storage quota or private mode — silently ignore
  }
}
