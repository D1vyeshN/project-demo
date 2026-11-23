import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useItems } from "@/modules/inventory/useItems";
import { useInvoices } from "@/modules/sales/useInvoices";
import { useParties } from "@/modules/parties/useParties";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

/* ---------- formatting helpers ---------- */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ---------- period helpers ---------- */

const sameMonth = (iso: string, d: Date) => {
  const dt = new Date(iso);
  return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth();
};

interface Bucket {
  label: string;
  total: number;
}

function buildBuckets(invoices: Invoice[], months: number): Bucket[] {
  const now = new Date();

  if (months === 1) {
    const arr: Bucket[] = [];
    for (let i = 4; i >= 1; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7 + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() - (i - 1) * 7);
      end.setHours(23, 59, 59, 999);
      const total = invoices.reduce((s, inv) => {
        const d = new Date(inv.date);
        return d >= start && d <= end ? s + inv.total : s;
      }, 0);
      arr.push({
        label: start.toLocaleDateString("en", {
          day: "numeric",
          month: "short",
        }),
        total,
      });
    }
    return arr;
  }

  const arr: Bucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = invoices.reduce(
      (s, inv) => (sameMonth(inv.date, d) ? s + inv.total : s),
      0,
    );
    arr.push({ label: d.toLocaleDateString("en", { month: "short" }), total });
  }
  return arr;
}

/* ---------- sales overview chart (SVG area chart, matches mockup) ---------- */

function SalesChart({ buckets }: { buckets: Bucket[] }) {
  const W = 640;
  const H = 240;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const rawMax = Math.max(...buckets.map((b) => b.total), 1);
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceMax = Math.ceil(rawMax / pow) * pow;

  const x = (i: number) =>
    padL +
    (buckets.length === 1 ? plotW / 2 : (i / (buckets.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / niceMax) * plotH;

  const points = buckets.map((b, i) => ({ cx: x(i), cy: y(b.total) }));
  const linePath = points
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].cx.toFixed(1)} ${(
    padT + plotH
  ).toFixed(1)} L ${points[0].cx.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const gridFractions = [0, 1 / 3, 2 / 3, 1];
  const isEmpty = buckets.every((b) => b.total === 0);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-64"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Sales overview chart"
      >
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + y labels */}
        {gridFractions.map((f) => {
          const gy = padT + plotH - f * plotH;
          const label = Math.round(niceMax * f).toLocaleString("en-IN");
          return (
            <g key={f}>
              <line
                x1={padL}
                y1={gy}
                x2={W - padR}
                y2={gy}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={f === 0 ? "0" : "4 4"}
              />
              <text
                x={padL - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-gray-400"
                fontSize="10"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* area + line */}
        <path d={areaPath} fill="url(#salesGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="3.5"
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        ))}

        {/* x labels */}
        {buckets.map((b, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize="10"
          >
            {b.label}
          </text>
        ))}
      </svg>
      {isEmpty && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          No sales data for this period yet.
        </p>
      )}
    </div>
  );
}

/* ---------- delta chip ---------- */

function Delta({ value, forceDown }: { value?: number; forceDown?: boolean }) {
  if (forceDown) {
    return (
      <span className="text-xs font-medium flex items-center gap-1 text-red-600">
        ↓
      </span>
    );
  }
  if (value === undefined || !isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        "text-xs font-medium flex items-center gap-1",
        up ? "text-green-600" : "text-red-600",
      )}
    >
      {up ? "↑" : "↓"} {Math.abs(Math.round(value))}%
    </span>
  );
}

/* ---------- page ---------- */

export default function Dashboard() {
  const { items } = useItems();
  const { invoices } = useInvoices();
  const { parties } = useParties();
  const navigate = useNavigate();
  const [range, setRange] = useState("6");

  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // KPI: Total Sales (This Month)
  const thisMonthInvoices = invoices.filter((inv) => sameMonth(inv.date, now));
  const prevMonthInvoices = invoices.filter((inv) =>
    sameMonth(inv.date, prevMonthDate),
  );
  const totalSales = thisMonthInvoices.reduce((s, inv) => s + inv.total, 0);
  const prevSales = prevMonthInvoices.reduce((s, inv) => s + inv.total, 0);
  const salesChange =
    prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : undefined;

  // KPI: Total Receivables (party outstanding balances)
  const receivables = parties.reduce(
    (s, p) => s + Math.max(0, p.currentOutstanding),
    0,
  );
  const unpaidThisMonth = thisMonthInvoices.reduce(
    (s, inv) => s + Math.max(0, inv.total - inv.amountReceived),
    0,
  );
  const prevReceivables = Math.max(0, receivables - unpaidThisMonth);
  const receivablesChange =
    prevReceivables > 0
      ? ((receivables - prevReceivables) / prevReceivables) * 100
      : undefined;

  // KPI: Total Stock Value
  const stockValue = items.reduce(
    (s, it) => s + it.currentStock * it.sellingPrice,
    0,
  );

  // KPI + panel: Low Stock (per-item reorder level)
  const lowStock = items
    .filter((it) => it.currentStock <= 5)
    .sort((a, b) => a.currentStock - b.currentStock);
  const lowStockCount = lowStock.length;
  const lowStockPreview = lowStock.slice(0, 5);

  const recentSales = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [invoices],
  );

  const chartBuckets = useMemo(
    () => buildBuckets(invoices, Number(range)),
    [invoices, range],
  );

  const statusColor: Record<string, string> = {
    Paid: "bg-green-100 text-green-700 border border-green-200",
    "Partially Paid": "bg-amber-100 text-amber-700 border border-amber-200",
    Unpaid: "bg-red-100 text-red-700 border border-red-200",
  };

  const kpiCards = [
    {
      title: "Total Sales (This Month)",
      value: inr(totalSales),
      change: salesChange,
    },
    {
      title: "Total Receivables",
      value: inr(receivables),
      change: receivablesChange,
    },
    { title: "Total Stock Value", value: inr(stockValue), change: undefined },
    {
      title: "Items Low In Stock",
      value: String(lowStockCount),
      change: undefined,
      forceDown: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
              <Delta value={kpi.change} forceDown={kpi.forceDown} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Overview */}
          <Card className="border-gray-200">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">
                Sales Overview
              </CardTitle>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                aria-label="Sales overview period"
                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last 1 Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
              </select>
            </CardHeader>
            <CardContent className="px-4 py-2">
              <SalesChart buckets={chartBuckets} />
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200">
                <div className="overflow-y-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead className="text-right w-24">
                          Amount
                        </TableHead>
                        <TableHead className="text-center w-20">
                          Payment Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-gray-500"
                          >
                            No sales yet. Create your first invoice.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentSales.map((inv) => (
                          <TableRow
                            key={inv.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() =>
                              navigate(`/sales/invoices/${inv.id}`)
                            }
                          >
                            <TableCell className="font-medium text-gray-900">
                              {inv.invoiceNo}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {formatDate(inv.date)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {inv.partyName}
                            </TableCell>
                            <TableCell className="text-right font-medium text-gray-900">
                              {inr(inv.total)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Badge
                                  className={cn(
                                    statusColor[inv.status],
                                    "px-2 py-1",
                                  )}
                                >
                                  {inv.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Items */}
        <Card className="h-fit border-gray-200">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">
              Low Stock Items
            </CardTitle>
            <Link
              to="/low-stock"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            {lowStockPreview.length === 0 ? (
              <p
                className={`text-center ${items.length !== 0 ? `text-green-600 font-medium` : " px-8"} py-4`}
              >
                {items.length === 0
                  ? "No items yet. Please add items to track low stock."
                  : "✅ All items are well stocked. No low-stock alerts."}
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 border-b border-gray-200 pb-2 mb-1">
                  <span className="flex-1">Item</span>
                  <span className="w-14 text-center">Stock</span>
                </div>
                <div className="space-y-1">
                  {lowStockPreview.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                    >
                      <span className="flex-1 text-sm font-medium text-gray-900 truncate pr-2">
                        {it.name}
                      </span>
                      <span className="w-14 text-center text-sm text-gray-600">
                        {it.currentStock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
