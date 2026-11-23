import { useState, useMemo, useRef } from 'react';
import { Search as SearchIcon, Package, Check } from 'lucide-react';
import { input as Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/lib/utils';
import type { Item } from '@/lib/types';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

type ItemSelectorProps = {
  items: Item[];
  onAdd: (item: Item) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  selectedItemId?: string;
};

export default function ItemSelector({
  items,
  onAdd,
  placeholder = 'Search by item name or SKU...',
  className,
  disabled,
  label,
  selectedItemId,
}: ItemSelectorProps) {
  const [itemSearch, setItemSearch] = useState('');
  const [itemOpen, setItemOpen] = useState(false);
  const itemSearchRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }, [items, itemSearch]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleAdd = (item: Item) => {
    onAdd(item);
    setItemSearch('');
    setItemOpen(false);
    itemSearchRef.current?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <Label className="mb-1.5 block text-xs text-gray-600 uppercase tracking-wide">
          {label}
        </Label>
      )}
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={itemSearchRef}
          value={itemSearch}
          onChange={(e) => {
            setItemSearch(e.target.value);
            setItemOpen(true);
          }}
          onFocus={() => setItemOpen(true)}
          placeholder={placeholder}
          className="pl-9 h-9"
          disabled={disabled}
        />
        {itemOpen && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-input bg-popover shadow-lg">
            <ul className="max-h-80 overflow-y-auto py-1">
              {filteredItems.length === 0 ? (
                <li className="px-4 py-4 text-center text-sm text-gray-500">
                  No items found. Add items in Items & Stock first.
                </li>
              ) : (
                filteredItems.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => handleAdd(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-blue-50 disabled:cursor-not-allowed ${
                        selectedItemId === i.id
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : ''
                      }`}
                      disabled={disabled}
                    >
                      {i.imageUrl ? (
                        <img
                          src={i.imageUrl}
                          alt={i.name}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100">
                          <Package className="h-5 w-5 text-gray-400" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-900">
                          {i.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          SKU: {i.sku} · Stock: {i.currentStock} ·{' '}
                          {formatINR(i.sellingPrice)} · GST: {i.gstRate}%
                        </span>
                      </span>
                      {selectedItemId === i.id && (
                        <span className="ml-auto text-xs text-green-600">
                          <Check className="h-4 w-4" /> Selected
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
        {selectedItem && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Selected Item</span>
            <span className="text-xs font-medium text-gray-900 truncate">
              {selectedItem.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
