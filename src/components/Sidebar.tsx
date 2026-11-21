import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const sidebarItems = [
  {
    label: 'Dashboard',
    icon: '📊',
    to: '/',
  },
  {
    label: 'Items & Stock',
    icon: '📦',
    items: [
      { label: 'Dashboard', to: '/', icon: '📊' },
      { label: 'Item Master', to: '/items', icon: '📋' },
      { label: 'Stock Movements', to: '/stock-movements', icon: '📈' },
    ],
  },
  {
    label: 'Parties',
    icon: '👥',
    to: '/parties',
  },
  {
    label: 'Sales',
    icon: '💰',
    items: [
      { label: 'Create Sale', to: '/invoices/new', icon: '➕' },
      { label: 'Sales Invoices', to: '/invoices/new', icon: '🧾' },
    ],
  },
  {
    label: 'Purchases',
    icon: '🛒',
    to: '/stock-movements',
  },
  {
    label: 'Inventory',
    icon: '📋',
    to: '/low-stock',
  },
  {
    label: 'Reports',
    icon: '📄',
    items: [
      { label: 'Party Ledger', to: '/parties', icon: '📒' },
      { label: 'Low Stock Alert', to: '/low-stock', icon: '⚠️' },
    ],
  },
  {
    label: 'Settings',
    icon: '⚙️',
    to: '/',
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isActive = (to: string) => {
    return location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  };

  const toggleSection = (label: string) => {
    const next = new Set(expandedSections);
    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }
    setExpandedSections(next);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <span className={`font-bold text-lg ${collapsed ? 'hidden' : 'block'}`}>
            HisaabKitaab
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '▸' : '◀'}
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-4rem)] px-3 py-2 space-y-1">
        {sidebarItems.map((section) => {
          if (section.items) {
            const isExpanded = expandedSections.has(section.label);
            const hasActiveChild = section.items.some((item) => isActive(item.to));
            return (
              <div key={section.label} className="rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium transition ${
                    hasActiveChild || isExpanded
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{section.icon}</span>
                    <span className={collapsed ? 'hidden' : 'block'}>{section.label}</span>
                  </span>
                  <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                <div
                  className={`pl-8 space-y-1 ${
                    isExpanded || hasActiveChild ? '' : 'hidden'
                  }`}
                >
                  {section.items.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setCollapsed(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
                          active
                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="w-5 text-center">{item.icon}</span>
                        <span className={collapsed ? 'hidden' : 'block'}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active = isActive(section.to);
          return (
            <Link
              key={section.to}
              to={section.to}
              onClick={() => setCollapsed(false)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition ${
                active
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 text-center">{section.icon}</span>
              <span className={collapsed ? 'hidden' : 'block'}>
                {section.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
            A
          </div>
          <div className={collapsed ? 'hidden' : 'block'}>
            <div className="text-sm font-medium text-gray-900">Admin</div>
            <div className="text-xs text-gray-500">admin@hisaabkitaab.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
