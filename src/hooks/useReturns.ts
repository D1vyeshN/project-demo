import { useState, useEffect, useCallback } from 'react';
import type { Return } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

const RETURNS_CHANGED_EVENT = 'returns:changed';

export function useReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const latest = getStorage(STORAGE_KEYS.RETURNS, [] as Return[]);
      setReturns((prev) =>
        JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest
      );
    };
    sync();
    setLoading(false);
    window.addEventListener(RETURNS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(RETURNS_CHANGED_EVENT, sync);
  }, []);

  const save = useCallback((next: Return[]) => {
    setReturns(next);
    setStorage(STORAGE_KEYS.RETURNS, next);
    window.dispatchEvent(new Event(RETURNS_CHANGED_EVENT));
  }, []);

  const addReturn = useCallback(
    (ret: Omit<Return, 'id' | 'createdAt'>) => {
      const now = nowISO();
      const newReturn: Return = { ...ret, id: generateId(), createdAt: now };
      save([...getStorage(STORAGE_KEYS.RETURNS, [] as Return[]), newReturn]);
      return newReturn;
    },
    [save]
  );

  const deleteReturn = useCallback(
    (id: string) => {
      save(
        getStorage(STORAGE_KEYS.RETURNS, [] as Return[]).filter(
          (r) => r.id !== id
        )
      );
    },
    [save]
  );

  return {
    returns,
    loading,
    addReturn,
    deleteReturn,
    setReturns: save,
  };
}