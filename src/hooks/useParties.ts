import { useState, useEffect, useCallback } from 'react';
import type { Party } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

export function useParties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setParties(getStorage(STORAGE_KEYS.PARTIES, []));
    setLoading(false);
  }, []);

  const save = useCallback((next: Party[]) => {
    setParties(next);
    setStorage(STORAGE_KEYS.PARTIES, next);
  }, []);

  const addParty = useCallback((party: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = nowISO();
    const newParty: Party = { ...party, id: generateId(), createdAt: now, updatedAt: now };
    const next = [...parties, newParty];
    save(next);
    return newParty;
  }, [parties, save]);

  const updateParty = useCallback((id: string, updates: Partial<Party>) => {
    const next = parties.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: nowISO() } : p
    );
    save(next);
  }, [parties, save]);

  const deleteParty = useCallback((id: string) => {
    const next = parties.filter((p) => p.id !== id);
    save(next);
  }, [parties, save]);

  const getParty = useCallback((id: string) => parties.find((p) => p.id === id), [parties]);

  return { parties, loading, addParty, updateParty, deleteParty, getParty, setParties };
}
