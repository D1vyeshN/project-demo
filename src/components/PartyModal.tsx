import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParties } from '../hooks/useParties';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import type { Party } from '../lib/types';

type PartyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId?: string;
  /** Called after a new party is created, so callers can auto-select it. */
  onSaved?: (party: Party) => void;
};

type PartyFormData = {
  name: string;
  phone: string;
  gstin: string;
  address: string;
  openingOutstanding: number;
};

const emptyPartyForm: PartyFormData = {
  name: '',
  phone: '',
  gstin: '',
  address: '',
  openingOutstanding: 0,
};

export default function PartyModal({ open, onOpenChange, partyId, onSaved }: PartyModalProps) {
  const { parties, loading, addParty, updateParty } = useParties();

  const isEdit = Boolean(partyId);
  const existing = useMemo(() => partyId ? parties.find((p) => p.id === partyId) : undefined, [partyId, parties]);

  const [form, setForm] = useState<PartyFormData>({ ...emptyPartyForm });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Handle cancel/close with dirty check
  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Helper to properly compare form with original (avoids JSON.stringify issues)
  const isFormDirty = useCallback((formData: PartyFormData, orig: Partial<Pick<Party, 'name' | 'phone' | 'gstin' | 'address' | 'openingOutstanding'>>): boolean => {
    return (
      formData.name !== (orig.name || '') ||
      formData.phone !== (orig.phone || '') ||
      formData.gstin !== (orig.gstin || '') ||
      formData.address !== (orig.address || '') ||
      formData.openingOutstanding !== (orig.openingOutstanding || 0)
    );
  }, []);

  useEffect(() => {
    if (open) {
      if (isEdit && existing) {
        setForm({
          name: existing.name,
          phone: existing.phone,
          gstin: existing.gstin || '',
          address: existing.address || '',
          openingOutstanding: existing.openingOutstanding,
        });
      } else {
        setForm({ ...emptyPartyForm });
      }
      setError('');
      setIsDirty(false);
    }
  }, [open, partyId, isEdit, existing]);

  const handleChange = useCallback(
    (key: keyof PartyFormData, value: any) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const orig = isEdit && existing ? existing : emptyPartyForm;
        setIsDirty(isFormDirty(next, orig));
        return next;
      });
    },
    [isEdit, existing, isFormDirty]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!form.name.trim()) {
        setError('Party name is required.');
        return;
      }

      const party = {
        name: form.name,
        phone: form.phone,
        gstin: form.gstin || undefined,
        address: form.address || undefined,
        openingOutstanding: form.openingOutstanding,
      };

      if (isEdit && existing) {
        // Preserve currentOutstanding - it's calculated from invoices
        updateParty(existing.id, { ...party, currentOutstanding: existing.currentOutstanding });
      } else {
        const created = addParty({
          ...party,
          currentOutstanding: form.openingOutstanding,
        });
        onSaved?.(created);
      }
      setIsDirty(false);
      onOpenChange(false);
    },
    [isEdit, existing, form, addParty, updateParty, onOpenChange, onSaved]
  );

  if (loading) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Party' : 'Add New Party'}
          </DialogTitle>
        </div>
        <DialogDescription className="sr-only">
          {isEdit
            ? 'Modify the party details below and save your changes.'
            : 'Enter the party details below to add a new customer/supplier.'}
        </DialogDescription>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Party Name *</Label>
                <Input
                  required
                  placeholder="e.g. ABC Traders"
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">GSTIN</Label>
                <Input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('gstin', e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">
                  Opening Outstanding Balance{' '}
                  <span
                    className="ml-0.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-gray-400 text-[9px] font-medium text-gray-500"
                    title="Carried-forward balance from previous dues. It is included in the party's total outstanding."
                  >
                    ?
                  </span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.openingOutstanding}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('openingOutstanding', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="w-full">
              <Label className="mb-1.5 block">Billing Address</Label>
              <textarea
                rows={2}
                placeholder="e.g. 123 Market Street, Mumbai, Maharashtra 400001"
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('address', e.target.value)}
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
                {isEdit ? 'Save Party' : 'Add Party'}
              </Button>
            </div>
          </form>
        </CardContent>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Discard changes?"
      description="You have unsaved changes. Discard them?"
      onConfirm={handleConfirmClose}
      confirmLabel="Discard"
      cancelLabel="Cancel"
    />
    </>
  );
}