import { useState, useEffect, useCallback } from 'react';
import type { Party } from '@/lib/types';
import { getStorage, setStorage, generateId, nowISO } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// Multiple components (page + modals) each run their own useParties() instance.
// Writers persist to localStorage and broadcast this event so every instance
// re-reads and stays in sync.
const PARTIES_CHANGED_EVENT = 'parties:changed';

export function useParties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const latest = getStorage(STORAGE_KEYS.PARTIES, [] as Party[]);
      setParties((prev) =>
        JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest
      );
    };
    sync();
    setLoading(false);
    window.addEventListener(PARTIES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PARTIES_CHANGED_EVENT, sync);
  }, []);

  const save = useCallback((next: Party[]) => {
    setParties(next);
    setStorage(STORAGE_KEYS.PARTIES, next);
    window.dispatchEvent(new Event(PARTIES_CHANGED_EVENT));
  }, []);

  // Writers always read the latest storage snapshot first, so concurrent
  // writers (e.g. PartyModal + Parties page) never clobber each other.
  const addParty = useCallback(
    (party: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = nowISO();
      const newParty: Party = { ...party, id: generateId(), createdAt: now, updatedAt: now };
      save([...getStorage(STORAGE_KEYS.PARTIES, [] as Party[]), newParty]);
      return newParty;
    },
    [save]
  );

  const updateParty = useCallback(
    (id: string, updates: Partial<Party>) => {
      const next = getStorage(STORAGE_KEYS.PARTIES, [] as Party[]).map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: nowISO() } : p
      );
      save(next);
    },
    [save]
  );

  const deleteParty = useCallback(
    (id: string) => {
      save(getStorage(STORAGE_KEYS.PARTIES, [] as Party[]).filter((p) => p.id !== id));
    },
    [save]
  );

  const getParty = useCallback(
    (id: string) => getStorage(STORAGE_KEYS.PARTIES, [] as Party[]).find((p) => p.id === id),
    []
  );

  return {
    parties,
    loading,
    addParty,
    updateParty,
    deleteParty,
    getParty,
    // Persisting version — updates state AND localStorage, then broadcasts sync
    setParties: save,
  };
}
