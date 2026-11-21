import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { GST_RATES, UNITS } from '../lib/constants';
import type { Item } from '../lib/types';

type ItemFormData = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: ItemFormData = {
  sku: '',
  name: '',
  sellingPrice: 0,
  gstRate: 18,
  unit: 'PCS',
  openingStock: 0,
  currentStock: 0,
};

export default function ItemForm() {
  const { items, loading, addItem, updateItem } = useItems();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Track whether this component is in edit mode and which id it's editing
  const editIdRef = useRef<string | null>(id || null);

  const existing = isEdit ? items.find((i) => i.id === id) : undefined;

  // Reset form when the route id changes (e.g., navigating between edit pages)
  useEffect(() => {
    editIdRef.current = id || null;
    if (isEdit && existing) {
      setForm({
        sku: existing.sku,
        name: existing.name,
        sellingPrice: existing.sellingPrice,
        gstRate: existing.gstRate,
        unit: existing.unit,
        openingStock: existing.openingStock,
        currentStock: existing.currentStock,
      });
      setError('');
      setIsDirty(false);
    } else if (!isEdit) {
      setForm({ ...emptyForm });
      setError('');
      setIsDirty(false);
    }
  }, [id, isEdit, existing]);

  const [form, setForm] = useState<ItemFormData>({ ...emptyForm });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Mark form as dirty whenever user changes a field
  const handleChange = useCallback(
    (key: keyof ItemFormData, value: any) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        // Only mark dirty if value differs from original
        if (isEdit && existing) {
          const orig = existing as unknown as ItemFormData;
          setIsDirty(JSON.stringify(next) !== JSON.stringify(orig));
        } else {
          setIsDirty(
            next.sku !== '' ||
              next.name !== '' ||
              next.sellingPrice !== 0 ||
              next.gstRate !== 18 ||
              next.unit !== 'PCS' ||
              next.openingStock !== 0 ||
              next.currentStock !== 0
          );
        }
        return next;
      });
    },
    [isEdit, existing]
  );

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
      // Duplicate SKU check (excluding self when editing)
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

  // Warn if navigating away with unsaved changes
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

  // Edit mode: item not found (may have been deleted)
  if (isEdit && !loading && !existing) {
    return (
      <div className="max-w-2xl bg-white p-6 rounded-lg border border-red-200">
        <h1 className="text-2xl font-bold text-gray-900">Item Not Found</h1>
        <p className="text-gray-600 mt-2">
          The item you are trying to edit no longer exists.
        </p>
        <Link
          to="/items"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Back to Items
        </Link>
      </div>
    );
  }

  // Loading state for edit mode
  if (isEdit && loading && !existing) {
    return (
      <div className="max-w-2xl bg-white p-6 rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Loading Item...</h1>
        <p className="text-gray-600 mt-2">Please wait while we fetch the item details.</p>
      </div>
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

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU / Item Code *
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.sku}
            onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selling Price *
          </label>
          <input
            type="number"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.sellingPrice}
            onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GST Rate *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.gstRate}
            onChange={(e) =>
              handleChange('gstRate', e.target.value as unknown as 0 | 5 | 12 | 18 | 28)
            }
          >
            {GST_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.unit}
            onChange={(e) =>
              handleChange('unit', e.target.value as 'PCS' | 'BOX' | 'KG' | 'etc.')
            }
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opening Stock
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.openingStock}
            onChange={(e) => handleChange('openingStock', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Stock
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={form.currentStock}
            onChange={(e) => handleChange('currentStock', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={!isDirty && isEdit}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
              isDirty || !isEdit
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEdit ? 'Update Item' : 'Save Item'}
          </button>
          <Link to="/items" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
