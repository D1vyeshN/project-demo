import { useState, useCallback } from 'react';
import { useParties } from '@/modules/parties/useParties';
import { useInvoices } from '@/modules/sales/useInvoices';
import { usePayments } from '@/modules/payments/usePayments';
import { nextPaymentNo } from '@/lib/constants';
import type { PaymentMode } from '@/lib/types';
import { Button } from '@/shared/ui/button';
import { input as Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

type PaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: string;
  invoiceId?: string;
  balanceDue?: number;
  onSaved?: () => void;
};

export default function PaymentModal({
  open,
  onOpenChange,
  partyId,
  invoiceId,
  balanceDue,
  onSaved,
}: PaymentModalProps) {
  const { parties, updateParty } = useParties();
  const { invoices, recordPayment } = useInvoices();
  const { payments, addPayment } = usePayments();

  const party = parties.find((p) => p.id === partyId);
  const invoice = invoiceId ? invoices.find((inv) => inv.id === invoiceId) : undefined;

  const [amount, setAmount] = useState(balanceDue ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate rounded amount for cash
  const finalAmount = paymentMode === 'Cash' ? Math.round(amount) : amount;
  const roundOff = paymentMode === 'Cash' ? finalAmount - amount : 0;

  const handleSave = useCallback(() => {
    if (!finalAmount || finalAmount <= 0) return;

    // Record payment on invoice (updates amountReceived, status, roundOff)
    if (invoiceId) {
      recordPayment(invoiceId, finalAmount, paymentMode, paymentRef || undefined);
    }

    // Update party outstanding balance — reduce by payment amount
    // Allow negative balance (credit: you owe the party)
    if (party) {
      const newOutstanding = party.currentOutstanding - finalAmount;
      updateParty(party.id, { currentOutstanding: newOutstanding });
    }

    // Create payment record
    const newRefNo = nextPaymentNo(payments);
    addPayment({
      refNo: newRefNo,
      partyId,
      invoiceId,
      amount: finalAmount,
      roundOff: roundOff !== 0 ? roundOff : undefined,
      paymentMode,
      paymentRef: paymentRef || undefined,
      date,
    });

    // Reset form
    setAmount(balanceDue ?? 0);
    setPaymentMode('Cash');
    setPaymentRef('');
    setDate(new Date().toISOString().split('T')[0]);

    onSaved?.();
    onOpenChange(false);
  }, [
    amount,
    paymentMode,
    paymentRef,
    date,
    finalAmount,
    roundOff,
    invoiceId,
    partyId,
    party,
    recordPayment,
    addPayment,
    updateParty,
    payments,
    balanceDue,
    onSaved,
    onOpenChange,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] p-0 gap-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-base font-semibold">Record Payment</DialogTitle>
          </div>
          <DialogDescription className="px-6 py-3 border-b border-gray-200">
            Record payment received against this party.
          </DialogDescription>
          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Party</Label>
                  <Input
                    readOnly
                    value={party?.name ?? ''}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Invoice</Label>
                  <Input
                    readOnly
                    value={invoice?.invoiceNo ?? '—'}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className={finalAmount !== amount ? 'bg-amber-50/50 border-amber-200' : undefined}
                  />
                  {finalAmount !== amount && (
                    <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex justify-between text-xs text-amber-800 mb-1">
                        <span>Original amount:</span>
                        <span>₹{amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-amber-800">
                        <span>Rounded (cash):</span>
                        <span>₹{finalAmount}</span>
                      </div>
                      {roundOff !== 0 && (
                        <div className="flex justify-between text-xs mt-1">
                          <span>Round-off:</span>
                          <span className={roundOff > 0 ? 'text-green-600' : 'text-red-600'}>
                            {roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-1.5 block">Payment Mode</Label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                    <option value="etc.">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-5 border-t border-gray-200 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!finalAmount || finalAmount <= 0}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition disabled:opacity-60 ${
                    (finalAmount > 0)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
