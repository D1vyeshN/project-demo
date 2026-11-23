import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  User,
  DollarSign,
  ShoppingCart,
  Inbox,
  ChevronDown,
  Menu as MenuIcon,
  Trash2,
  Download,
} from "lucide-react";
import { useItems } from "@/modules/inventory/useItems";
import { useParties } from "@/modules/parties/useParties";
import { useInvoices } from "@/modules/sales/useInvoices";
import { usePurchases } from "@/modules/purchases/usePurchases";
import { usePayments } from "@/modules/payments/usePayments";
import { clearAllStorage, generateId, nowISO } from "@/lib/storage";
import {
  generateSmartTempData,
  smartTempItems,
  smartTempParties,
  smartTempInvoices,
  smartTempPurchases,
} from "@/lib/tempData";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "sonner";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: <Home className="w-4 h-4" />,
    to: "/",
  },
  {
    label: "Items & Stock",
    icon: <Package className="w-4 h-4" />,
    to: "/items-stock",
  },
  {
    label: "Parties",
    icon: <User className="w-4 h-4" />,
    items: [
      {
        label: "Party Master",
        to: "/parties",
        icon: <Package className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    label: "Sales",
    icon: <DollarSign className="w-4 h-4" />,
    items: [
      {
        label: "Create Sale",
        to: "/sales/new",
        icon: <Package className="w-3.5 h-3.5" />,
      },
      {
        label: "Sale Invoices",
        to: "/sales/invoices",
        icon: <Package className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    label: "Purchases",
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      {
        label: "Purchase Orders",
        to: "/purchases",
        icon: <Package className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    label: "Inventory",
    icon: <Inbox className="w-4 h-4" />,
    items: [
      {
        label: "Low Stock Alert",
        to: "/low-stock",
        icon: <Package className="w-3.5 h-3.5" />,
      },
    ],
  },
];

// All menu paths, flattened — used so the LONGEST matching path wins
const allMenuPaths = sidebarItems.flatMap((section) =>
  section.items ? section.items.map((child) => child.to) : [section.to],
);

const matchesPath = (pathname: string, to: string) => {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
};

const isActivePath = (pathname: string, to: string) => {
  if (!matchesPath(pathname, to)) return false;
  // Another, more specific menu path also matches → that one wins instead
  return !allMenuPaths.some(
    (p) => p !== to && p.length > to.length && matchesPath(pathname, p),
  );
};

// Labels of sections containing the active item (for auto-expand)
const activeSectionLabels = (pathname: string) =>
  sidebarItems
    .filter(
      (section) =>
        section.items?.some((child) => isActivePath(pathname, child.to)) ??
        false,
    )
    .map((section) => section.label);

export default function SidebarComponent() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(activeSectionLabels(location.pathname)),
  );
  const { pathname } = location;
  const { items, setItems } = useItems();
  const { parties, setParties } = useParties();
  const { setInvoices, setMovements } = useInvoices();
  const { setPurchases } = usePurchases();
  const { setPayments } = usePayments();

  // Show "Clear Data" if ANY master data exists (items OR parties)
  const hasAnyData = items.length > 0 || parties.length > 0;

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const handleLoadSeed = () => {
    if (hasAnyData) {
      toast.error("Master data already exists");
      return;
    }

    const now = nowISO();
    const { items, parties, invoices, purchases, payments, stockMovements } =
      generateSmartTempData();

    // Step 1: Generate items with real IDs
    const tempItems = items.map((it) => ({
      ...it,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    const itemIdMap: Record<string, string> = {};
    tempItems.forEach((item, i) => {
      itemIdMap[smartTempItems[i].sku] = item.id;
    });

    // Step 2: Generate parties with real IDs
    const tempParties = parties.map((p) => ({
      ...p,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    const partyIdMap: Record<string, string> = {};
    tempParties.forEach((party, i) => {
      partyIdMap[smartTempParties[i].name] = party.id;
    });

    // Step 3: Generate invoices with mapped party IDs and item IDs
    const tempInvoices = invoices.map((inv) => {
      const partyName = inv.partyName;
      const partyId = partyIdMap[partyName] || inv.partyId;
      return {
        ...inv,
        id: generateId(),
        partyId,
        partyName: smartTempParties.find((p) => p.name === inv.partyName)?.name || inv.partyName,
        items: inv.items.map((it) => ({
          ...it,
          itemId: itemIdMap[it.itemId] || it.itemId,
        })),
        createdAt: now,
        updatedAt: now,
      };
    });
    const invoiceIdMap: Record<string, string> = {};
    tempInvoices.forEach((inv, i) => {
      invoiceIdMap[smartTempInvoices[i].invoiceNo] = inv.id;
    });

    // Step 4: Generate purchases with mapped item IDs
    const tempPurchases = purchases.map((p) => ({
      ...p,
      id: generateId(),
      itemId: itemIdMap[p.itemId] || p.itemId,
      createdAt: now,
    }));
    const purchaseIdMap: Record<string, string> = {};
    tempPurchases.forEach((p, i) => {
      purchaseIdMap[smartTempPurchases[i].refNo] = p.id;
    });

    // Step 5: Generate payments with mapped invoice IDs
    const tempPayments = payments.map((pay) => ({
      ...pay,
      id: generateId(),
      partyId: partyIdMap[pay.partyId] || pay.partyId,
      invoiceId: invoiceIdMap[pay.invoiceId || ''] || undefined,
      createdAt: now,
    }));

    // Step 5.5: Recalculate party currentOutstanding based on opening + invoices - payments
    const tempPartiesWithOutstanding = tempParties.map((party) => {
      const partyInvoices = tempInvoices.filter((inv) => inv.partyId === party.id);
      const partyPayments = tempPayments.filter((pay) => pay.partyId === party.id);
      const totalInvoiced = partyInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = partyPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const newOutstanding = party.openingOutstanding + totalInvoiced - totalPaid;
      return {
        ...party,
        currentOutstanding: newOutstanding,
      };
    });

    // Step 6: Generate stock movements with mapped item IDs and ref IDs
    const tempStockMovements = stockMovements.map((m) => ({
      ...m,
      id: generateId(),
      itemId: m.itemId ? itemIdMap[m.itemId] : m.itemId,
      refId: m.refId ? invoiceIdMap[m.refId] || purchaseIdMap[m.refId] : m.refId,
      date: m.date,
    }));

    setItems(tempItems);
    setParties(tempPartiesWithOutstanding);
    setInvoices(tempInvoices);
    setPurchases(tempPurchases);
    setPayments(tempPayments);
    setMovements(tempStockMovements);

    toast.success(
      `Successfully loaded ${tempItems.length} items, ${tempParties.length} parties, ${tempInvoices.length} invoices, ${tempPurchases.length} purchases, ${tempPayments.length} payments, and ${tempStockMovements.length} stock movements as temporary data.`,
    );
  };

  const handleClearData = () => {
    setClearConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    setClearConfirmOpen(false);
    clearAllStorage();
    setItems([]);
    setParties([]);
    toast.success("All data has been cleared.");
    window.location.reload();
  };

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
    <div className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200">
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
          open ? "block" : "hidden",
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Content */}
      <div className="flex h-full flex-col overflow-y-auto w-64">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            H
          </div>
          <span
            className={`font-bold text-lg tracking-tight ${collapsed ? "hidden" : "block"}`}
          >
            HisabKitab
          </span>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] px-2 py-2 space-y-0.5 bg-blue-200/10">
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
                        ? "bg-blue-200/35 text-blue-700"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {React.cloneElement(section.icon, {
                        className: "w-4 h-4 shrink-0",
                      })}
                      <span className={collapsed ? "hidden" : "block"}>
                        {section.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 shrink-0 transition-transform duration-200",
                        isExpanded ? "rotate-180" : "",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "pl-8 space-y-0.5",
                      isExpanded ? "" : "hidden",
                    )}
                  >
                    {section.items.map((item) => {
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 mt-1 px-3 py-1.5 text-sm rounded-lg transition ${
                            active
                              ? "bg-blue-200/75 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          }`}
                        >
                          {/* <span className="w-5 flex items-center justify-center shrink-0">
                            {React.cloneElement(item.icon, {
                              className: "w-3.5 h-3.5",
                            })}
                          </span> */}
                          <span className={collapsed ? "hidden" : "block"}>
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
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                <span className="w-5 flex items-center justify-center shrink-0">
                  {React.cloneElement(section.icon, { className: "w-4 h-4" })}
                </span>
                <span className={collapsed ? "hidden" : "block"}>
                  {section.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto bg-blue-200/10">
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={hasAnyData ? handleClearData : handleLoadSeed}
                className={`w-full px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                  hasAnyData
                    ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                }`}
              >
                {hasAnyData ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Data
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Add Temp Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear all data?"
        description={
          "Are you sure you want to clear ALL data? This will remove items, parties, invoices and stock movements. This cannot be undone."
        }
        onConfirm={handleConfirmClear}
        confirmLabel="Clear Data"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
}
