import { Navigate, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemsStock from './pages/ItemsStock';
import PartiesPage from './pages/Parties';
import PartyLedger from './pages/PartyLedger';
import InvoiceView from './pages/InvoiceView';
import Invoices from './pages/Invoices';
import LowStockPage from './pages/LowStock';
import InvoiceForm from './pages/InvoiceForm';
import NotFound from './pages/NotFound';
import PurchasesPage from './pages/Purchases';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items-stock" element={<ItemsStock />} />
        <Route
          path="/items"
          element={<Navigate to="/items-stock?tab=items" replace />}
        />
        <Route
          path="/stock-movements"
          element={<Navigate to="/items-stock?tab=stock" replace />}
        />
        <Route path="/parties" element={<PartiesPage />} />
        <Route path="/parties/:id/ledger" element={<PartyLedger />} />
        <Route path="/sales/new" element={<InvoiceForm />} />
        <Route path="/sales/invoices" element={<Invoices />} />
        <Route path="/sales/invoices/:id" element={<InvoiceView />} />
        <Route path="/sales/invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="/low-stock" element={<LowStockPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
