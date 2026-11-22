import { Link } from 'react-router-dom';
import { Search, Bell, Menu, Package, Trash2, Download } from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { useParties } from '../hooks/useParties';
import { clearAllStorage, generateId, nowISO } from '../lib/storage';
import { generateTempItems, generateTempParties } from '../lib/tempData';

export default function Header() {
  const { items, setItems } = useItems();
  const { parties, setParties } = useParties();

  // Show "Clear Data" if ANY master data exists (items OR parties)
  const hasAnyData = items.length > 0 || parties.length > 0;

  const handleLoadSeed = () => {
    // Add only once — guard against existing master data
    if (hasAnyData) {
      window.alert(
        'Master data already exists. Use "Clear Data" to remove it first.'
      );
      return;
    }

    const now = nowISO();

    // Generate 10 random items
    const tempItems = generateTempItems().map((it) => ({
      ...it,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));

    // Generate 10 random parties
    const tempParties = generateTempParties().map((p) => ({
      ...p,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));

    // Persisted via the hook setters (state + localStorage)
    setItems(tempItems);
    setParties(tempParties);

    window.alert(
      `Successfully loaded 10 items and 10 parties as temporary data.`
    );
    window.location.reload();
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear ALL data?\n\nThis will remove items, parties, invoices and stock movements. This cannot be undone.'
    );
    if (!confirmed) return;

    clearAllStorage();
    setItems([]);
    setParties([]);

    window.alert('All data has been cleared.');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-input">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-700">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <span>HisaabKitaab</span>
          </Link>
        </div>

        <div className="hidden md:flex-1 md:flex items-center max-w-[400px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={hasAnyData ? handleClearData : handleLoadSeed}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
              hasAnyData
                ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
                : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            {hasAnyData ? (
              <>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Data
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Load Temp Data
              </>
            )}
          </button>
          <button className="p-2 rounded-md hover:bg-muted text-muted-foreground relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive border border-white"></span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-input">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
              A
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Admin</div>
              <div className="text-xs text-muted-foreground">admin@hisaabkitaab.com</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}