import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
    verify2FA,
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
    systemSettings,
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

  // Auto-logout after inactivity, per the user's own Session Timeout
  // preference. `sessionTimeoutMinutes` of null/undefined means "Never".
  useEffect(() => {
    const timeoutMinutes = currentUser?.sessionTimeoutMinutes;
    if (!currentUser || !timeoutMinutes) return;

    let lastActivity = Date.now();
    const markActivity = () => { lastActivity = Date.now(); };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, markActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivity >= timeoutMinutes * 60 * 1000) {
        toast.info('You have been logged out due to inactivity');
        handleLogout();
      }
    }, 15_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, markActivity));
      clearInterval(checkInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.sessionTimeoutMinutes]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // If not logged in, show login page
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={login} onVerify2FA={verify2FA} />
        <Toaster />
      </>
    );
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage products={products} transactions={transactions} systemSettings={systemSettings} />;
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
        return <DashboardPage products={products} transactions={transactions} systemSettings={systemSettings} />;
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
          currentUser={currentUser}
          systemSettings={systemSettings}
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