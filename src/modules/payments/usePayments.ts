import { useState, useEffect, useCallback } from 'react';
import type { Payment } from '@/lib/types';
import { getStorage, setStorage, generateId, nowISO } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

const PAYMENTS_CHANGED_EVENT = 'payments:changed';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const latest = getStorage(STORAGE_KEYS.PAYMENTS, [] as Payment[]);
      setPayments((prev) =>
        JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest
      );
    };
    sync();
    setLoading(false);
    window.addEventListener(PAYMENTS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PAYMENTS_CHANGED_EVENT, sync);
  }, []);

  const save = useCallback((next: Payment[]) => {
    setPayments(next);
    setStorage(STORAGE_KEYS.PAYMENTS, next);
    window.dispatchEvent(new Event(PAYMENTS_CHANGED_EVENT));
  }, []);

  const addPayment = useCallback(
    (payment: Omit<Payment, 'id' | 'createdAt'>) => {
      const now = nowISO();
      const newPayment: Payment = { ...payment, id: generateId(), createdAt: now };
      save([...getStorage(STORAGE_KEYS.PAYMENTS, [] as Payment[]), newPayment]);
      return newPayment;
    },
    [save]
  );

  const deletePayment = useCallback(
    (id: string) => {
      save(
        getStorage(STORAGE_KEYS.PAYMENTS, [] as Payment[]).filter(
          (p) => p.id !== id
        )
      );
    },
    [save]
  );

  return {
    payments,
    loading,
    addPayment,
    deletePayment,
    setPayments: save,
  };
}
