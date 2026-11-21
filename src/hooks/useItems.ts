import { useState, useEffect, useCallback } from 'react';
import type { Item } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(getStorage(STORAGE_KEYS.ITEMS, []));
    setLoading(false);
  }, []);

  const save = useCallback((next: Item[]) => {
    setItems(next);
    setStorage(STORAGE_KEYS.ITEMS, next);
  }, []);

  const addItem = useCallback((item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = nowISO();
    const newItem: Item = { ...item, id: generateId(), createdAt: now, updatedAt: now };
    const next = [...items, newItem];
    save(next);
    return newItem;
  }, [items, save]);

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    const next = items.map((i) =>
      i.id === id ? { ...i, ...updates, updatedAt: nowISO() } : i
    );
    save(next);
  }, [items, save]);

  const deleteItem = useCallback((id: string) => {
    const next = items.filter((i) => i.id !== id);
    save(next);
  }, [items, save]);

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  return { items, loading, addItem, updateItem, deleteItem, getItem, setItems };
}
