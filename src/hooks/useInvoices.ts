import { useState, useEffect, useCallback } from 'react';
import type { Invoice, StockMovement, PaymentMode } from '../lib/types';
import { getStorage, setStorage, generateId, nowISO } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import { normalizeInvoiceItem, statusFrom } from '../lib/invoiceCalc';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStorage(STORAGE_KEYS.INVOICES, []);
    setInvoices(
      stored.map((inv) => ({
        ...inv,
        items: inv.items.map(normalizeInvoiceItem),
      }))
    );
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

  const recordPayment = useCallback(
    (
      invoiceId: string,
      amount: number,
      paymentMode: PaymentMode,
      paymentRef?: string
    ) => {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return null;

      const newAmountReceived = invoice.amountReceived + amount;
      const newStatus = statusFrom(newAmountReceived, invoice.total);

      const updatedInvoice: Invoice = {
        ...invoice,
        amountReceived: newAmountReceived,
        status: newStatus,
        paymentMode,
        paymentRef: paymentRef || invoice.paymentRef,
      };

      const next = invoices.map((inv) =>
        inv.id === invoiceId ? updatedInvoice : inv
      );
      saveInvoices(next);
      return updatedInvoice;
    },
    [invoices, saveInvoices]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      const next = invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      );
      saveInvoices(next);
      return invoices.find((inv) => inv.id === id);
    },
    [invoices, saveInvoices]
  );

  return {
    invoices,
    movements,
    loading,
    addInvoice,
    getInvoice,
    addMovement,
    recordPayment,
    updateInvoice,
    // Persisting versions — update state AND localStorage
    setInvoices: saveInvoices,
    setMovements: saveMovements,
  };
}
