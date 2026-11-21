import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

export default function SidebarComponent() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
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
    <div className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-input bg-sidebar">
      {/* Sidebar Trigger (Mobile) */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
        aria-label="Toggle sidebar"
        onClick={() => {
          setOpen(!open);
          setCollapsed(!collapsed);
        }}
      >
        ☰
      </button>

      {/* Sidebar Overlay (Mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm",
          open ? "block" : "hidden"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Content */}
      <div className="flex h-full flex-col overflow-y-auto border-r border-sidebar shadow-sm w-64">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar">
          <span className="text-xl">📦</span>
          <span className={`font-bold text-lg ${collapsed ? 'hidden' : 'block'}`}>HisaabKitaab</span>
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
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{section.icon}</span>
                      <span className={collapsed ? 'hidden' : 'block'}>
                        {section.label}
                      </span>
                    </span>
                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  <div className={cn('pl-8 space-y-1', isExpanded || hasActiveChild ? '' : 'hidden')}>
                    {section.items.map((item) => {
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
                            active
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
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

        <div className="flex items-center gap-2 px-6 py-4 border-t border-sidebar mt-auto">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
            A
          </div>
          <div className={collapsed ? 'hidden' : 'block'}>
            <div className="text-sm font-medium text-sidebar-foreground">Admin</div>
            <div className="text-xs text-sidebar-foreground/60">admin@hisaabkitaab.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
