import { useState, useEffect, useCallback } from 'react';
import type { Invoice, StockMovement, PaymentMode } from '@/lib/types';
import { getStorage, setStorage, generateId, nowISO } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import { normalizeInvoiceItem, statusFrom } from './invoiceCalc';

const INVOICES_CHANGED_EVENT = 'invoices:changed';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const stored = getStorage(STORAGE_KEYS.INVOICES, []);
      setInvoices(
        stored.map((inv) => ({
          ...inv,
          items: inv.items.map(normalizeInvoiceItem),
        }))
      );
      setMovements(getStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []));
      setLoading(false);
    };
    sync();
    window.addEventListener(INVOICES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(INVOICES_CHANGED_EVENT, sync);
  }, []);

  const saveInvoices = useCallback((next: Invoice[]) => {
    setInvoices(next);
    setStorage(STORAGE_KEYS.INVOICES, next);
    window.dispatchEvent(new Event(INVOICES_CHANGED_EVENT));
  }, []);

  const saveMovements = useCallback((next: StockMovement[]) => {
    setMovements(next);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, next);
  }, []);

  const addInvoice = useCallback(
    (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
      const now = nowISO();
      const newInvoice: Invoice = { ...invoice, id: generateId(), createdAt: now };
      const stored = getStorage(STORAGE_KEYS.INVOICES, []);
      const next = [newInvoice, ...stored];
      saveInvoices(next);
      return newInvoice;
    },
    [saveInvoices]
  );

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  const addMovement = useCallback(
    (movement: Omit<StockMovement, 'id'>) => {
      const newMovement: StockMovement = { ...movement, id: generateId() };
      const stored = getStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []);
      const next = [...stored, newMovement];
      saveMovements(next);
      return newMovement;
    },
    [saveMovements]
  );

  const recordPayment = useCallback(
    (
      invoiceId: string,
      amount: number,
      paymentMode: PaymentMode,
      paymentRef?: string
    ) => {
      // Read latest invoice from storage to avoid stale closure state
      const stored = getStorage(STORAGE_KEYS.INVOICES, []);
      const invoice = stored.find((inv) => inv.id === invoiceId);
      if (!invoice) return null;

      // Validation: amount must be positive
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
      }

      // Cash rounding: round to nearest rupee when mode is Cash
      const finalAmount = paymentMode === 'Cash' ? Math.round(amount) : amount;
      const roundOff = paymentMode === 'Cash'
        ? Number((finalAmount - amount).toFixed(2))
        : 0;

      const newAmountReceived = invoice.amountReceived + finalAmount;
      const newStatus = statusFrom(newAmountReceived, invoice.total);
      const newRoundOff = (invoice.roundOff ?? 0) + roundOff;

      const updatedInvoice: Invoice = {
        ...invoice,
        amountReceived: newAmountReceived,
        roundOff: newRoundOff,
        status: newStatus,
        paymentMode,
        paymentRef: paymentRef || invoice.paymentRef,
      };

      const next = stored.map((inv) =>
        inv.id === invoiceId ? updatedInvoice : inv
      );
      saveInvoices(next);
      return updatedInvoice;
    },
    [saveInvoices]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      const stored = getStorage(STORAGE_KEYS.INVOICES, []);
      const next = stored.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      );
      saveInvoices(next);
      return next.find((inv) => inv.id === id);
    },
    [saveInvoices]
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
    setInvoices: saveInvoices,
    setMovements: saveMovements,
  };
}
