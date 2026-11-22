import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useItems } from '../hooks/useItems';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { GST_RATES, UNITS, CATEGORIES } from '../lib/constants';
import type { Item } from '../lib/types';

type ItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string;
};

type ItemFormData = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: ItemFormData = {
  sku: '',
  name: '',
  category: '',
  sellingPrice: 0,
  gstRate: 18,
  unit: 'PCS',
  openingStock: 0,
  currentStock: 0,
  description: '',
  imageUrl: '',
};

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ItemModal({ open, onOpenChange, itemId }: ItemModalProps) {
  const { items, loading, addItem, updateItem } = useItems();

  const isEdit = Boolean(itemId);
  const existing = useMemo(() => itemId ? items.find((i) => i.id === itemId) : undefined, [itemId, items]);

  const [form, setForm] = useState<ItemFormData>({ ...emptyForm });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle cancel/close with dirty check
  const handleClose = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  // Helper to properly compare form with original (avoids JSON.stringify issues)
  const isFormDirty = useCallback((formData: ItemFormData, orig: Partial<Item>): boolean => {
    return (
      formData.name !== (orig.name || '') ||
      formData.sku !== (orig.sku || '') ||
      formData.category !== (orig.category || '') ||
      formData.sellingPrice !== (orig.sellingPrice || 0) ||
      formData.gstRate !== (orig.gstRate || 18) ||
      formData.unit !== (orig.unit || 'PCS') ||
      formData.openingStock !== (orig.openingStock || 0) ||
      formData.currentStock !== (orig.currentStock || 0) ||
      formData.description !== (orig.description || '') ||
      formData.imageUrl !== (orig.imageUrl || '')
    );
  }, []);

  // Reset file input when modal closes
  useEffect(() => {
    if (!open && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (isEdit && existing) {
        setForm({
          sku: existing.sku,
          name: existing.name,
          category: existing.category || '',
          sellingPrice: existing.sellingPrice,
          gstRate: existing.gstRate,
          unit: existing.unit,
          openingStock: existing.openingStock,
          currentStock: existing.currentStock,
          description: existing.description || '',
          imageUrl: existing.imageUrl || '',
        });
        setImagePreview(existing.imageUrl || null);
      } else {
        setForm({ ...emptyForm });
        setImagePreview(null);
      }
      setError('');
      setIsDirty(false);
    }
  }, [open, itemId, isEdit, existing]);

  const handleChange = useCallback(
    (key: keyof ItemFormData, value: string | number) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const orig = isEdit && existing ? existing : emptyForm;
        setIsDirty(isFormDirty(next, orig));
        return next;
      });
    },
    [isEdit, existing, isFormDirty]
  );

  // Single "Quantity (Stock)" field (mockup) — drives currentStock; on add it
  // also seeds openingStock. On edit, openingStock is left untouched.
  const handleQuantity = useCallback(
    (value: number) => {
      const qty = Math.max(0, Math.floor(value) || 0);
      setForm((prev) => {
        const next = isEdit
          ? { ...prev, currentStock: qty }
          : { ...prev, currentStock: qty, openingStock: qty };
        setIsDirty(isFormDirty(next, isEdit && existing ? existing! : emptyForm));
        return next;
      });
    },
    [isFormDirty, isEdit, existing]
  );

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm((prev) => {
          const next = { ...prev, imageUrl: reader.result as string };
          setIsDirty(isFormDirty(next, isEdit && existing ? existing! : emptyForm));
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  }, [isFormDirty, isEdit, existing]);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setForm((prev) => {
      const next = { ...prev, imageUrl: '' };
      setIsDirty(isFormDirty(next, isEdit && existing ? existing! : emptyForm));
      return next;
    });
  }, [isFormDirty, isEdit, existing]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!form.name.trim()) {
        setError('Item name is required.');
        return;
      }
      if (!form.sku.trim()) {
        setError('SKU / Item Code is required.');
        return;
      }
      const skuExists = items.some(
        (i) => i.sku.toLowerCase() === form.sku.toLowerCase() && i.id !== itemId
      );
      if (skuExists) {
        setError('An item with this SKU already exists.');
        return;
      }
      if (form.sellingPrice < 0) {
        setError('Selling price cannot be negative.');
        return;
      }
      if (form.currentStock < 0) {
        setError('Stock quantity cannot be negative.');
        return;
      }

      if (isEdit && existing) {
        updateItem(existing.id, { ...form, currentStock: form.currentStock });
      } else {
        addItem({ ...form, openingStock: form.currentStock });
      }
      setIsDirty(false);
      onOpenChange(false);
    },
    [items, itemId, isEdit, existing, form, addItem, updateItem, onOpenChange, isFormDirty]
  );

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </div>
        <DialogDescription className="sr-only">
          {isEdit
            ? 'Modify the item details below and save your changes.'
            : 'Enter the item details below to add a new product.'}
        </DialogDescription>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form fields (left) */}
              <div className="md:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Item Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Laptop"
                      value={form.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">SKU / Item Code</Label>
                    <Input
                      placeholder="e.g. ITM001"
                      value={form.sku}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('sku', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      aria-label="Category"
                      className={SELECT_CLASS}
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Unit</Label>
                    <select
                      value={form.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      aria-label="Unit"
                      className={SELECT_CLASS}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">GST Rate *</Label>
                    <select
                      value={String(form.gstRate)}
                      onChange={(e) =>
                        handleChange('gstRate', parseInt(e.target.value) as 0 | 5 | 12 | 18 | 28)
                      }
                      aria-label="GST Rate"
                      className={SELECT_CLASS}
                    >
                      {GST_RATES.map((rate) => (
                        <option key={rate} value={String(rate)}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Selling Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 25000"
                      required
                      value={form.sellingPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('sellingPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Quantity (Stock) *</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 5"
                      required
                      value={form.currentStock}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleQuantity(parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Image upload (right) */}
              <div className="md:col-span-4">
                <Label className="mb-1.5 block">Product Image</Label>
                <div className="aspect-square w-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors relative">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                        <UploadIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-500 text-center px-4">
                        Click to upload
                      </p>
                      <p className="text-[11px] text-gray-400 text-center px-4 mt-1">
                        JPG or PNG
                      </p>
                      <label className="mt-3 text-blue-600 text-sm font-medium cursor-pointer hover:text-blue-700 block text-center">
                        Browse
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description — full width (mockup) */}
            <div>
              <Label className="mb-1.5 block">Description (Optional)</Label>
              <textarea
                rows={3}
                placeholder="e.g. High performance laptop"
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange('description', e.target.value)
                }
              />
            </div>

            <div className="flex gap-3 pt-5 border-t border-gray-200 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty && isEdit}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                  isDirty || !isEdit
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isEdit ? 'Update Item' : 'Save Item'}
              </Button>
            </div>
          </form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}