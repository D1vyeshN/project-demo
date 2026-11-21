import { useState, useEffect, useCallback } from 'react';
import type { Invoice, StockMovement } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInvoices(getStorage(STORAGE_KEYS.INVOICES, []));
    setMovements(getStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []));
    setLoading(false);
  }, []);

  const saveInvoices = useCallback((next: Invoice[]) => {
    setInvoices(next);
    setStorage(STORAGE_KEYS.INVOICES, next);
  }, []);

  const saveMovements = useCallback((next: StockMovement[]) => {
    setMovements(next);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, next);
  }, []);

  const addInvoice = useCallback(
    (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
      const now = nowISO();
      const newInvoice: Invoice = { ...invoice, id: generateId(), createdAt: now };
      const next = [newInvoice, ...invoices];
      saveInvoices(next);
      return newInvoice;
    },
    [invoices, saveInvoices]
  );

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  const addMovement = useCallback(
    (movement: Omit<StockMovement, 'id'>) => {
      const newMovement: StockMovement = { ...movement, id: generateId() };
      const next = [...movements, newMovement];
      saveMovements(next);
      return newMovement;
    },
    [movements, saveMovements]
  );

  return {
    invoices,
    movements,
    loading,
    addInvoice,
    getInvoice,
    addMovement,
    setInvoices,
    setMovements,
  };
}
