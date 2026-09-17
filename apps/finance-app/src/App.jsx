import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth } from './firebase';
import { isUserAuthorizedForComptroller } from './auth';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import LoginScreen from './components/Auth/LoginScreen';

// Pages
import Dashboard from './pages/Dashboard';
import AddSale from './pages/sale/AddSale';
import SaleInvoices from './pages/sale/SaleInvoices';
import Estimates from './pages/sale/Estimates';
import PaymentIn from './pages/sale/PaymentIn';
import CreditNote from './pages/sale/CreditNote';
import PurchaseBills from './pages/purchase/PurchaseBills';
import Expenses from './pages/purchase/Expenses';
import Parties from './pages/Parties';
import Items from './pages/Items';
import CashBank from './pages/CashBank';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('sale_invoices'); // Default to Sale Invoices like in screenshot
  const [addSaleInitialData, setAddSaleInitialData] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    // STRICT SECURITY: Enforce in-memory persistence.
    // Credentials and tokens are NEVER cached or remembered across page reloads/sessions.
    setPersistence(auth, inMemoryPersistence).catch(err => {
      console.warn("Could not set in-memory persistence:", err);
    });

    // Explicitly sign out on startup to purge any legacy persistent sessions stored in IndexedDB/cache
    signOut(auth).catch(() => {});
    setCurrentUser(null);
    setIsAccessDenied(false);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User must be in authorized whitelist (Yash, Samiran, Line Producer, Accounts)
        const isAuth = isUserAuthorizedForComptroller(user);
        if (isAuth) {
          setCurrentUser(user);
          setIsAccessDenied(false);
        } else {
          setCurrentUser(null);
          setIsAccessDenied(true);
        }
      } else {
        // Unauthenticated - user MUST log in with password every time
        setCurrentUser(null);
        setIsAccessDenied(false);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      setIsAccessDenied(false);
    });
  };

  const handleOpenAddSale = (initialData = null) => {
    setAddSaleInitialData(initialData);
    setActiveTab('add_sale');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-slate-400 text-xs">
        Connecting to Studio Tunnel Financial Services...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        isAccessDenied={isAccessDenied}
        onSignOut={handleSignOut}
      />
    );
  }

  // If in Add Sale full-screen form mode
  if (activeTab === 'add_sale') {
    return (
      <AddSale
        initialData={addSaleInitialData}
        onClose={() => setActiveTab('sale_invoices')}
        onSaveSuccess={() => {
          setActiveTab('sale_invoices');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-[#f0f0ff] flex flex-col font-sans overflow-hidden">
      {/* ── Vyapar Customer Support & Global Header ── */}
      <TopBar
        onAddSale={() => handleOpenAddSale()}
        onAddPurchase={() => setActiveTab('purchase_bills')}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* ── Main Workspace Body (Sidebar + Content) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onQuickAddSale={() => handleOpenAddSale()}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#080810]">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={setActiveTab} />
          )}

          {activeTab === 'sale_invoices' && (
            <SaleInvoices
              onAddSale={() => handleOpenAddSale()}
              onSelectInvoice={(inv) => handleOpenAddSale(inv)}
            />
          )}

          {activeTab === 'estimates' && (
            <Estimates
              onConvertToSale={(convertedData) => handleOpenAddSale(convertedData)}
            />
          )}

          {activeTab === 'payment_in' && (
            <PaymentIn />
          )}

          {activeTab === 'credit_note' && (
            <CreditNote />
          )}

          {activeTab === 'purchase_bills' && (
            <PurchaseBills />
          )}

          {activeTab === 'expenses' && (
            <Expenses />
          )}

          {activeTab === 'parties' && (
            <Parties />
          )}

          {activeTab === 'items' && (
            <Items />
          )}

          {activeTab === 'cash_bank' && (
            <CashBank />
          )}

          {activeTab === 'reports' && (
            <Reports />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}

          {/* Fallbacks for sub-items that route to their primary module */}
          {(activeTab === 'proforma' || activeTab === 'sale_order' || activeTab === 'delivery_challan' || activeTab === 'pos') && (
            <SaleInvoices onAddSale={() => handleOpenAddSale()} />
          )}

          {(activeTab === 'payment_out' || activeTab === 'purchase_order' || activeTab === 'debit_note') && (
            <PurchaseBills />
          )}

          {activeTab === 'accounting' && (
            <Reports />
          )}
        </main>
      </div>
    </div>
  );
}
