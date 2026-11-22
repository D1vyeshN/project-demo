import { useState, useEffect, useCallback } from 'react';
import type { Purchase } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

// Multiple components each run their own usePurchases() instance.
// Writers persist to localStorage and broadcast this event so every instance
// re-reads and stays in sync.
const PURCHASES_CHANGED_EVENT = 'purchases:changed';

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const latest = getStorage(STORAGE_KEYS.PURCHASES, [] as Purchase[]);
      setPurchases((prev) =>
        JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest
      );
    };
    sync();
    setLoading(false);
    window.addEventListener(PURCHASES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PURCHASES_CHANGED_EVENT, sync);
  }, []);

  const save = useCallback((next: Purchase[]) => {
    setPurchases(next);
    setStorage(STORAGE_KEYS.PURCHASES, next);
    window.dispatchEvent(new Event(PURCHASES_CHANGED_EVENT));
  }, []);

  // Writers always read the latest storage snapshot first, so concurrent
  // writers never clobber each other.
  const addPurchase = useCallback(
    (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
      const now = nowISO();
      const newPurchase: Purchase = {
        ...purchase,
        id: generateId(),
        createdAt: now,
      };
      save([...getStorage(STORAGE_KEYS.PURCHASES, [] as Purchase[]), newPurchase]);
      return newPurchase;
    },
    [save]
  );

  const deletePurchase = useCallback(
    (id: string) => {
      save(
        getStorage(STORAGE_KEYS.PURCHASES, [] as Purchase[]).filter(
          (p) => p.id !== id
        )
      );
    },
    [save]
  );

  return {
    purchases,
    loading,
    addPurchase,
    deletePurchase,
    // Persisting version — updates state AND localStorage, then broadcasts sync
    setPurchases: save,
  };
}