import { useSearchParams } from 'react-router-dom';
import ItemsPanel from './Items';
import StockMovementsPanel from './StockMovements';

const TABS = [
  { key: 'items', label: 'Items' },
  { key: 'stock', label: 'Stock Movements' },
] as const;

export default function ItemsStock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'stock' ? 'stock' : 'items';

  return (
    <div className="space-y-6">
      {/* Tab strip — tab state lives in the URL (?tab=items | ?tab=stock) */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() =>
              setSearchParams(
                tab.key === 'items' ? {} : { tab: tab.key },
                { replace: true }
              )
            }
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'items' ? <ItemsPanel /> : <StockMovementsPanel />}
    </div>
  );
}
