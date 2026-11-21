import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { GST_RATES, UNITS, CATEGORIES } from '../lib/constants';
import type { Item } from '../lib/types';

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
  reorderLevel: 0,
  description: '',
  imageUrl: '',
};

export default function ItemForm() {
  const { items, loading, addItem, updateItem } = useItems();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const editIdRef = useRef<string | null>(id || null);

  const existing = isEdit ? items.find((i) => i.id === id) : undefined;

  useEffect(() => {
    editIdRef.current = id || null;
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
        reorderLevel: existing.reorderLevel || 0,
        description: existing.description || '',
        imageUrl: existing.imageUrl || '',
      });
      setError('');
      setIsDirty(false);
    } else if (!isEdit) {
      setForm({ ...emptyForm });
      setError('');
      setIsDirty(false);
      setImagePreview(null);
    }
  }, [id, isEdit, existing]);

  const [form, setForm] = useState<ItemFormData>({ ...emptyForm });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = useCallback(
    (key: keyof ItemFormData, value: any) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (isEdit && existing) {
          const orig = existing as unknown as ItemFormData;
          setIsDirty(JSON.stringify(next) !== JSON.stringify(orig));
        } else {
          setIsDirty(
            next.sku !== '' ||
              next.name !== '' ||
              next.category !== '' ||
              next.sellingPrice !== 0 ||
              next.gstRate !== 18 ||
              next.unit !== 'PCS' ||
              next.openingStock !== 0 ||
              next.currentStock !== 0 ||
              next.reorderLevel !== 0 ||
              next.description !== '' ||
              next.imageUrl !== ''
          );
        }
        return next;
      });
    },
    [isEdit, existing]
  );

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

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
        (i) => i.sku.toLowerCase() === form.sku.toLowerCase() && i.id !== id
      );
      if (skuExists) {
        setError('An item with this SKU already exists.');
        return;
      }
      if (form.sellingPrice < 0) {
        setError('Selling price cannot be negative.');
        return;
      }
      if (form.openingStock < 0 || form.currentStock < 0) {
        setError('Stock quantities cannot be negative.');
        return;
      }

      if (isEdit && existing) {
        updateItem(existing.id, { ...form, currentStock: form.currentStock });
      } else {
        addItem({ ...form });
      }
      setIsDirty(false);
      navigate('/items');
    },
    [items, id, isEdit, existing, form, addItem, updateItem, navigate]
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isEdit && !loading && !existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Item Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mt-2">
            The item you are trying to edit no longer exists.
          </p>
          <Link
            to="/items"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Back to Items
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && loading && !existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Item...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mt-2">
            Please wait while we fetch the item details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link to="/items" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to Items
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Item' : 'Add New Item'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Item' : 'Add New Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Image Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product Image
                  </span>
                </div>
                <div className="aspect-square w-full border-2 border-dashed border-input rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors relative group">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setForm((prev) => ({ ...prev, imageUrl: '' }));
                        }}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl text-gray-400 mb-2">📷</div>
                      <p className="text-xs text-gray-500 text-center px-4">
                        Uploaded item Image<br />
                        <span className="text-gray-400 text-xs">
                          JPG, PNG up to 2MB
                        </span>
                      </p>
                      <label className="mt-3 text-primary text-sm font-medium cursor-pointer hover:text-primary/90">
                        Click to upload
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Item Name *</Label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>SKU / Item Code *</Label>
                    <Input
                      required
                      value={form.sku}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('sku', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Unit *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Selling Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.sellingPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>GST Rate *</Label>
                    <Select
                      value={String(form.gstRate)}
                      onValueChange={(v: string) => handleChange('gstRate', parseInt(v) as 0 | 5 | 12 | 18 | 28)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((rate) => (
                          <SelectItem key={rate} value={String(rate)}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Opening Stock</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={form.openingStock}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('openingStock', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Current Stock</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={form.currentStock}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('currentStock', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Reorder Level</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={form.reorderLevel}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('reorderLevel', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-background outline-none"
                    value={form.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={!isDirty && isEdit}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                  isDirty || !isEdit
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isEdit ? 'Update Item' : 'Save Item'}
              </Button>
              <Link to="/items" className="px-6 py-2 border border-input text-foreground rounded-lg text-sm font-medium hover:bg-accent transition">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
