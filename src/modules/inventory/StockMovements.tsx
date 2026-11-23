import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useItems } from "./useItems";
import { useInvoices } from "@/modules/sales/useInvoices";
import { usePurchases } from "@/modules/purchases/usePurchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export default function StockMovementsPanel() {
  const { items } = useItems();
  const { movements } = useInvoices();
  const { purchases } = usePurchases();
  const [searchParams] = useSearchParams();

  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // Auto-select item from URL query param
  useEffect(() => {
    const itemParam = searchParams.get("item");
    if (itemParam && items.some((i) => i.id === itemParam)) {
      setSelectedItemId(itemParam);
    }
  }, [searchParams, items]);

  const saleMovements = movements.filter((m) => m.type === "Sales");
  const purchaseMovements = purchases.map((p) => ({
    id: p.id,
    itemId: p.itemId,
    type: "Purchase" as const,
    qty: p.qty,
    refId: p.refNo,
    date: p.date,
  }));

  const scopeItem = selectedItemId
    ? items.find((i) => i.id === selectedItemId)
    : undefined;

  // Build per-item chronological movements for the selected item
  const itemMovements =
    scopeItem &&
    [...saleMovements, ...purchaseMovements]
      .filter((m) => m.itemId === scopeItem.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Derive opening balance: currentStock minus net of all recorded movements
  let openingBalance = 0;
  let totalsInQty = 0;
  let totalsOutQty = 0;
  if (scopeItem && itemMovements) {
    const net = itemMovements.reduce(
      (acc, m) => acc + (m.type === "Purchase" ? m.qty : -m.qty),
      0,
    );
    openingBalance = scopeItem.currentStock - net;
    totalsInQty = itemMovements.reduce(
      (acc, m) => acc + (m.type === "Purchase" ? m.qty : 0),
      0,
    );
    totalsOutQty = itemMovements.reduce(
      (acc, m) => acc + (m.type === "Sales" ? m.qty : 0),
      0,
    );
  }

  const typeColor: Record<string, string> = {
    "Opening Stock": "bg-blue-100 text-blue-700",
    Sales: "bg-red-100 text-red-700",
    Purchase: "bg-green-100 text-green-700",
    Adjustment: "bg-amber-100 text-amber-700",
  };

  // Build table rows with running balance computed once (not during render mutation)
  const rows: Array<{
    date: string;
    type: string;
    refId: string;
    inQty: string;
    outQty: string;
    balance: number;
  }> = [];
  if (scopeItem && itemMovements) {
    let running = openingBalance;
    for (const m of itemMovements) {
      running += m.type === "Purchase" ? m.qty : -m.qty;
      rows.push({
        date: new Date(m.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        type: m.type,
        refId: m.refId || "—",
        inQty: m.type === "Purchase" ? `+${m.qty}` : "—",
        outQty: m.type === "Sales" ? String(m.qty) : "—",
        balance: running,
      });
    }
  }

  // Format item labels: "Name (SKU)"
  const itemLabels = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        label: `${i.name} (${i.sku})`,
      })),
    [items],
  );

  return (
    <div className="pb-10 space-y-6">
      {/* Item scope selector */}
      <div>
        <div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stock Movements{" "}
              {scopeItem ? `— ${scopeItem.name} (${scopeItem.sku})` : ""}
            </h1>
            <p className="text-sm mt-1 text-gray-600">
              Track item-wise stock in and out with dates and references.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-medium mb-1.5 pb-2 block">
            View movements for item
          </h3>
          <div className="w-1/3">
            <Combobox
              items={itemLabels}
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              placeholder="Select an item..."
            >
              <ComboboxInput placeholder="Select an item..." showClear />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item.id}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      {/* KPI row */}
      {scopeItem && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Opening Stock
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {openingBalance}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                In Qty
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {totalsInQty}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                Out Qty
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {totalsOutQty}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Current Stock
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {scopeItem.currentStock}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movements table */}
      <Card>
        <CardHeader>
          <CardTitle>Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {scopeItem ? (
            <DataTable
              columns={[
                {
                  key: "date",
                  label: "Date",
                  headerClassName: "w-24",
                  cellClassName: "",
                },
                {
                  key: "type",
                  label: "Type",
                  headerClassName: "w-20",
                  cellClassName: "",
                  render: (r: { type: string }) => (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[r.type]}`}
                    >
                      {r.type}
                    </span>
                  ),
                },
                {
                  key: "refId",
                  label: "Ref No",
                  headerClassName: "w-24",
                  cellClassName: "text-center text-gray-700 text-sm",
                },
                {
                  key: "inQty",
                  label: "In Qty",
                  headerClassName: "text-center w-16",
                  cellClassName: "text-center text-green-600",
                },
                {
                  key: "outQty",
                  label: "Out Qty",
                  headerClassName: "text-center w-16",
                  cellClassName: "text-center text-red-600",
                },
                {
                  key: "balance",
                  label: "Balance",
                  headerClassName: "text-right w-24",
                  cellClassName: "text-right font-medium text-gray-900",
                },
              ]}
              data={rows}
              pageSize={10}
              emptyMessage="No stock movements recorded yet."
              emptyColSpan={6}
            />
          ) : (
            <div className="text-xs text-gray-500">
              Select an item above to view its per-item stock movements (In Qty
              / Out Qty).
            </div>
          )}
        </CardContent>
      </Card>

     
    </div>
  );
}
