import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/Items';
import ItemForm from './pages/ItemForm';
import PartiesPage from './pages/Parties';
import PartyForm from './pages/PartyForm';
import PartyLedger from './pages/PartyLedger';
import InvoiceView from './pages/InvoiceView';
import LowStockPage from './pages/LowStock';
import StockMovementsPage from './pages/StockMovements';
import InvoiceForm from './pages/InvoiceForm';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id/edit" element={<ItemForm />} />
        <Route path="/parties" element={<PartiesPage />} />
        <Route path="/parties/new" element={<PartyForm />} />
        <Route path="/parties/:id/edit" element={<PartyForm />} />
        <Route path="/parties/:id/ledger" element={<PartyLedger />} />
        <Route path="/invoices/new" element={<InvoiceForm />} />
        <Route path="/invoices/:id" element={<InvoiceView />} />
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        <Route path="/low-stock" element={<LowStockPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
