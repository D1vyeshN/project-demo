import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useParties } from '../hooks/useParties';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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

export default function PartyForm() {
  const { parties, loading, addParty, updateParty } = useParties();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existing = isEdit ? parties.find((p) => p.id === id) : undefined;

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        phone: existing.phone,
        gstin: existing.gstin || '',
        address: existing.address || '',
        openingOutstanding: existing.openingOutstanding,
      });
      setError('');
      setIsDirty(false);
    } else if (!isEdit) {
      setForm({ ...emptyPartyForm });
      setError('');
      setIsDirty(false);
    }
  }, [id, isEdit, existing]);

  const [form, setForm] = useState<PartyFormData>({ ...emptyPartyForm });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback(
    (key: keyof PartyFormData, value: any) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (isEdit && existing) {
          const orig = existing as unknown as PartyFormData;
          setIsDirty(JSON.stringify(next) !== JSON.stringify(orig));
        } else {
          setIsDirty(
            next.name !== '' ||
              next.phone !== '' ||
              next.gstin !== '' ||
              next.address !== '' ||
              next.openingOutstanding !== 0
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
        setError('Party name is required.');
        return;
      }

      const party = {
        name: form.name,
        phone: form.phone,
        gstin: form.gstin || undefined,
        address: form.address || undefined,
        openingOutstanding: form.openingOutstanding,
        currentOutstanding: form.openingOutstanding,
      };

      if (isEdit && existing) {
        updateParty(existing.id, party);
      } else {
        addParty(party);
      }
      setIsDirty(false);
      navigate('/parties');
    },
    [parties, id, isEdit, existing, form, addParty, updateParty, navigate]
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
          <CardTitle>Party Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mt-2">
            The party you are trying to edit no longer exists.
          </p>
          <Link to="/parties" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Back to Parties
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isEdit && loading && !existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Party...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mt-2">
            Please wait while we fetch the party details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link to="/parties" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to Parties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Party' : 'Add New Party'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Party' : 'Add New Party'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <Label>Party Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label>GSTIN (optional)</Label>
              <Input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={form.gstin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('gstin', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Billing Address</Label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-background outline-none"
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('address', e.target.value)}
              />
            </div>
            <div>
              <Label>Opening Outstanding Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={form.openingOutstanding}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('openingOutstanding', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button
                type="submit"
                disabled={!isDirty && isEdit}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                  isDirty || !isEdit
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isEdit ? 'Save Party' : 'Save Party'}
              </Button>
              <Link to="/parties" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
