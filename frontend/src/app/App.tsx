import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockInOutPage } from './pages/StockInOutPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from './components/ui/sonner';

const AppContent: React.FC = () => {
  const {
    currentUser,
    login,
    logout,
    updateCurrentUser,
    refreshData,
    products,
    setProducts,
    suppliers,
    setSuppliers,
    transactions,
    setTransactions,
    users,
    setUsers,
    userActivityLogs,
    invoices,
    setInvoices,
  } = useApp();

  // After any mutation the page updates its specific resource immediately,
  // then we fire a full refresh to catch cross-resource side effects
  // (e.g. approving a transaction also changes product stock quantities).
  const makeCallback = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (data: T) => { setter(data); refreshData(); };

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setCurrentPage('dashboard');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // If not logged in, show login page
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={login} />
        <Toaster />
      </>
    );
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage products={products} transactions={transactions} />;
      case 'products':
        return <ProductsPage
          products={products}
          onProductsChange={makeCallback(setProducts)}
          suppliers={suppliers}
        />;
      case 'stock':
        return (
          <StockInOutPage
            products={products}
            transactions={transactions}
            currentUser={currentUser}
            onTransactionsChange={makeCallback(setTransactions)}
            onProductsChange={makeCallback(setProducts)}
          />
        );
      case 'suppliers':
        return <SuppliersPage suppliers={suppliers} onSuppliersChange={makeCallback(setSuppliers)} />;
      case 'invoices':
        return <InvoicesPage
          invoices={invoices}
          suppliers={suppliers}
          products={products}
          currentUser={currentUser}
          onInvoicesChange={makeCallback(setInvoices)}
        />;
      case 'reports':
        return <ReportsPage products={products} transactions={transactions} suppliers={suppliers} />;
      case 'users':
        return <UsersPage users={users} currentUser={currentUser} onUsersChange={makeCallback(setUsers)} activityLogs={userActivityLogs} />;
      case 'settings':
        return <SettingsPage currentUser={currentUser} />;
      default:
        return <DashboardPage products={products} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        currentUser={currentUser}
        onUpdateProfile={updateCurrentUser}
      />

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopBar
          onMenuToggle={toggleSidebar}
          products={products}
          transactions={transactions}
          suppliers={suppliers}
          invoices={invoices}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>

      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;