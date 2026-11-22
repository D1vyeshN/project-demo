import { useState, useCallback } from 'react';
import { useItems } from '../hooks/useItems';
import { usePurchases } from '../hooks/usePurchases';
import { useInvoices } from '../hooks/useInvoices';
import { generateId, nowISO } from '../lib/storage';
import { nextPurchaseNo } from '../lib/constants';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { X } from 'lucide-react';
const SELECT_CLASS =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

type PurchaseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PurchaseModal({ open, onOpenChange }: PurchaseModalProps) {
  const { items, setItems } = useItems();
  const { purchases, addPurchase } = usePurchases();
  const { movements, setMovements } = useInvoices();

  const [refNo, setRefNo] = useState(() => nextPurchaseNo(purchases));
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [note, setNote] = useState('');

  const handleSave = useCallback(() => {
    if (!itemId || qty <= 0) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newRefNo = nextPurchaseNo(purchases);

    // Persist purchase record
    addPurchase({
      refNo: newRefNo,
      itemId,
      itemName: item.name,
      qty,
      rate: rate || undefined,
      note: note || undefined,
      date: nowISO(),
    });

    // Increase stock
    const nextItems = items.map((i) =>
      i.id === itemId ? { ...i, currentStock: i.currentStock + qty } : i
    );
    setItems(nextItems);

    // Record Purchase movement
    const updatedItem = nextItems.find((i) => i.id === itemId);
    const newMovement = {
      id: generateId(),
      itemId,
      type: 'Purchase' as const,
      qty,
      refId: newRefNo,
      date: nowISO(),
      balance: updatedItem ? updatedItem.currentStock : item.currentStock + qty,
    };
    setMovements([...movements, newMovement]);

    // Reset form (ref no advances)
    setRefNo(nextPurchaseNo(purchases));
    setItemId('');
    setQty(0);
    setRate(0);
    setNote('');
  }, [itemId, qty, rate, note, items, setItems, purchases, addPurchase, movements, setMovements]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-base font-semibold">Add Purchase</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <DialogDescription className="px-6 py-3 border-b border-gray-200">
          Record stock coming in and update item availability.
        </DialogDescription>
        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form fields */}
              <div className="md:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Reference No</Label>
                    <Input
                      readOnly
                      value={refNo}
                      className="bg-gray-50 text-gray-600 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Item *</Label>
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">Select item</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.sku}) — Stock: {i.currentStock}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Qty (Stock) *</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="e.g. 5"
                      required
                      value={qty}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQty(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Rate / unit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 25000"
                      value={rate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRate(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Note</Label>
                    <Input
                      type="text"
                      placeholder="e.g. PO reference"
                      value={note}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNote(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-5 border-t border-gray-200 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!itemId || qty <= 0}
                className={`px-6 py-2 rounded-md text-sm font-medium transition disabled:opacity-60 ${
                  (itemId && qty > 0)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save Purchase
              </Button>
            </div>
          </form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
