import { useState, useCallback, useMemo, type ChangeEvent } from 'react';
import { useItems } from '@/modules/inventory/useItems';
import { usePurchases } from './usePurchases';
import { useInvoices } from '@/modules/sales/useInvoices';
import { generateId, nowISO, STORAGE_KEYS, getStorage } from '@/lib/storage';
import { nextPurchaseNo } from '@/lib/constants';
import { Button } from '@/shared/ui/button';
import { input as Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

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

  const itemLabels = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        label: `${i.name} (${i.sku})`,
      })),
    [items],
  );

  const handleSave = useCallback(() => {
    if (!itemId || qty <= 0) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const storedPurchases = getStorage(STORAGE_KEYS.PURCHASES, []);
    const newRefNo = nextPurchaseNo(storedPurchases);

    addPurchase({
      refNo: newRefNo,
      itemId,
      itemName: item.name,
      qty,
      rate: rate || undefined,
      note: note || undefined,
      date: nowISO(),
    });

    const nextItems = items.map((i) =>
      i.id === itemId ? { ...i, currentStock: i.currentStock + qty } : i
    );
    setItems(nextItems);

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
        </div>
        
        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
            <div className="grid grid-cols-1 gap-6">
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
                    <Combobox
                      items={itemLabels}
                      value={itemId}
                      onValueChange={(value) => {
                        setItemId(value);
                        setQty(1);
                      }}
                      placeholder="Select an item"
                    >
                      <ComboboxInput className="h-9" showClear />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          No items found. Add items in Items & Stock first.
                        </ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.id} value={item.id}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Qty (Stock) *</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 5"
                  required
                  value={qty}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setRate(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1.5 block">Note</Label>
                <Input
                  type="text"
                  placeholder="e.g. PO reference"
                  value={note}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNote(e.target.value)
                  }
                />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}