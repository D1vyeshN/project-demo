import { Layout } from '@/shared/components/Layout';
import { NotFound } from '@/shared/components/NotFound';
import { RouteError } from '@/shared/components/RouteError';
import Dashboard from '@/modules/dashboard/Dashboard';
import ItemsStock from '@/modules/inventory/ItemsStock';
import Items from '@/modules/inventory/Items';
import LowStock from '@/modules/inventory/LowStock';
import StockMovements from '@/modules/inventory/StockMovements';
import PartiesPage from '@/modules/parties/Parties';
import PartyLedger from '@/modules/parties/PartyLedger';
import Invoices from '@/modules/sales/Invoices';
import InvoiceForm from '@/modules/sales/InvoiceForm';
import InvoiceView from '@/modules/sales/InvoiceView';
import PurchasesPage from '@/modules/purchases/Purchases';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/items-stock', element: <ItemsStock /> },
      { path: '/items', element: <Items /> },
      { path: '/stock-movements', element: <StockMovements /> },
      { path: '/low-stock', element: <LowStock /> },
      { path: '/parties', element: <PartiesPage /> },
      { path: '/parties/:id/ledger', element: <PartyLedger /> },
      { path: '/sales/new', element: <InvoiceForm /> },
      { path: '/sales/invoices', element: <Invoices /> },
      { path: '/sales/invoices/:id', element: <InvoiceView /> },
      { path: '/sales/invoices/:id/edit', element: <InvoiceForm /> },
      { path: '/purchases', element: <PurchasesPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export default routes;
