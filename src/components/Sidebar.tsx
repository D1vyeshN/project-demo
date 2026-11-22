import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Package,
  User,
  DollarSign,
  ShoppingCart,
  Inbox,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  Menu as MenuIcon,
} from 'lucide-react';

const sidebarItems = [
  {
    label: 'Dashboard',
    icon: <Home className="w-4 h-4" />,
    to: '/',
  },
  {
    label: 'Items & Stock',
    icon: <Package className="w-4 h-4" />,
    to: '/items-stock',
  },
  {
    label: 'Parties',
    icon: <User className="w-4 h-4" />,
    items: [
      { label: 'Party Master', to: '/parties', icon: <Package className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Sales',
    icon: <DollarSign className="w-4 h-4" />,
    items: [
      { label: 'Create Sale', to: '/sales/new', icon: <Package className="w-3.5 h-3.5" /> },
      { label: 'Sale Invoices', to: '/sales/invoices', icon: <Package className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Purchases',
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { label: 'Purchase Orders', to: '/purchases', icon: <Package className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Inventory',
    icon: <Inbox className="w-4 h-4" />,
    items: [
      { label: 'Low Stock Alert', to: '/low-stock', icon: <Package className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Reports',
    icon: <BarChart3 className="w-4 h-4" />,
    to: '/reports',
  },
  {
    label: 'Settings',
    icon: <SettingsIcon className="w-4 h-4" />,
    to: '/settings',
  },
];

// All menu paths, flattened — used so the LONGEST matching path wins
const allMenuPaths = sidebarItems.flatMap((section) =>
  section.items
    ? section.items.map((child) => child.to)
    : [section.to]
);

const matchesPath = (pathname: string, to: string) => {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
};

const isActivePath = (pathname: string, to: string) => {
  if (!matchesPath(pathname, to)) return false;
  // Another, more specific menu path also matches → that one wins instead
  return !allMenuPaths.some(
    (p) => p !== to && p.length > to.length && matchesPath(pathname, p)
  );
};

// Labels of sections containing the active item (for auto-expand)
const activeSectionLabels = (pathname: string) =>
  sidebarItems
    .filter(
      (section) =>
        section.items?.some((child) => isActivePath(pathname, child.to)) ?? false
    )
    .map((section) => section.label);

export default function SidebarComponent() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(activeSectionLabels(location.pathname))
  );
  const { pathname } = location;

  const isActive = (to: string) => isActivePath(pathname, to);

  const isSectionActive = (items: { to: string }[]) => {
    return items.some((item) => isActive(item.to));
  };

  // Auto-expand the section containing the active item on navigation
  React.useEffect(() => {
    const labels = activeSectionLabels(pathname);
    if (labels.length === 0) return;
    setExpandedSections((prev) => {
      if (labels.every((label) => prev.has(label))) return prev;
      const next = new Set(prev);
      labels.forEach((label) => next.add(label));
      return next;
    });
  }, [pathname]);

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
    <div className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-gray-50">
      {/* Sidebar Trigger (Mobile) */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-gray-200 text-gray-600"
        aria-label="Toggle menu"
        onClick={() => {
          setOpen(!open);
          setCollapsed(!collapsed);
        }}
      >
        <MenuIcon className="w-5 h-5" />
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
      <div className="flex h-full flex-col overflow-y-auto w-64">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            H
          </div>
          <span className={`font-bold text-lg tracking-tight ${collapsed ? 'hidden' : 'block'}`}>
            HisaabKitaab
          </span>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] px-2 py-2 space-y-0.5">
          {sidebarItems.map((section) => {
            if (section.items) {
              const isExpanded = expandedSections.has(section.label);
              const hasActiveChild = isSectionActive(section.items);
              const isActiveSection = hasActiveChild;
              return (
                <div key={section.label} className="rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.label)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium transition ${
                      isActiveSection
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {React.cloneElement(section.icon, { className: 'w-4 h-4 shrink-0' })}
                      <span className={collapsed ? 'hidden' : 'block'}>
                        {section.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 shrink-0 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : ''
                      )}
                    />
                  </button>
                  <div className={cn('pl-8 space-y-0.5', isExpanded ? '' : 'hidden')}>
                    {section.items.map((item) => {
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
                            active
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          <span className="w-5 flex items-center justify-center shrink-0">
                            {React.cloneElement(item.icon, { className: 'w-3.5 h-3.5' })}
                          </span>
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
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="w-5 flex items-center justify-center shrink-0">
                  {React.cloneElement(section.icon, { className: 'w-4 h-4' })}
                </span>
                <span className={collapsed ? 'hidden' : 'block'}>
                  {section.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-gray-200">
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
              A
            </div>
            <div className={collapsed ? 'hidden' : 'block'}>
              <div className="text-sm font-medium text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">admin@hisaabkitaab.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

