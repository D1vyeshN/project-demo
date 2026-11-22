import { useState, useEffect, useCallback } from 'react';
import type { Item } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

// Multiple components (page + modals) each run their own useItems() instance.
// Writers persist to localStorage and broadcast this event so every instance
// re-reads and stays in sync.
const ITEMS_CHANGED_EVENT = 'items:changed';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const latest = getStorage(STORAGE_KEYS.ITEMS, [] as Item[]);
      setItems((prev) =>
        JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest
      );
    };
    sync();
    setLoading(false);
    window.addEventListener(ITEMS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ITEMS_CHANGED_EVENT, sync);
  }, []);

  const save = useCallback((next: Item[]) => {
    setItems(next);
    setStorage(STORAGE_KEYS.ITEMS, next);
    window.dispatchEvent(new Event(ITEMS_CHANGED_EVENT));
  }, []);

  // Writers always read the latest storage snapshot first, so concurrent
  // writers (e.g. ItemModal + Items page) never clobber each other.
  const addItem = useCallback(
    (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = nowISO();
      const newItem: Item = { ...item, id: generateId(), createdAt: now, updatedAt: now };
      save([...getStorage(STORAGE_KEYS.ITEMS, [] as Item[]), newItem]);
      return newItem;
    },
    [save]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Item>) => {
      const next = getStorage(STORAGE_KEYS.ITEMS, [] as Item[]).map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: nowISO() } : i
      );
      save(next);
    },
    [save]
  );

  const deleteItem = useCallback(
    (id: string) => {
      save(getStorage(STORAGE_KEYS.ITEMS, [] as Item[]).filter((i) => i.id !== id));
    },
    [save]
  );

  const getItem = useCallback(
    (id: string) => getStorage(STORAGE_KEYS.ITEMS, [] as Item[]).find((i) => i.id === id),
    []
  );

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    // Persisting version — updates state AND localStorage, then broadcasts sync
    setItems: save,
  };
}
