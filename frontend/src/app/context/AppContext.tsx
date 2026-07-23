import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Product, Supplier, StockTransaction, UserActivityLog, Invoice, SystemSettings } from '../types';
import { authApi, productsApi, suppliersApi, transactionsApi, usersApi, invoicesApi, settingsApi } from '../services/api';

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = { lowStockThresholdPercent: 20, defaultCategory: 'Other' };

const USER_STORAGE_KEY = 'inv_auth_user';

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user: User | null): void => {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
};

const POLL_INTERVAL_MS = 15_000;

interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; email?: string }>;
  verify2FA: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginError: string | null;
  updateCurrentUser: (user: User) => void;
  refreshData: () => Promise<void>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  transactions: StockTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<StockTransaction[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  userActivityLogs: UserActivityLog[];
  setUserActivityLogs: React.Dispatch<React.SetStateAction<UserActivityLog[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  systemSettings: SystemSettings;
  refreshSystemSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  // Keep a ref so polling always sees the current user without re-registering the interval
  const currentUserRef = React.useRef<User | null>(null);
  currentUserRef.current = currentUser;

  const loadAllData = async (user: User) => {
    const [prods, supps, txns, invs, sysSettings] = await Promise.all([
      productsApi.getAll(),
      suppliersApi.getAll(),
      transactionsApi.getAll(),
      invoicesApi.getAll(),
      settingsApi.get().catch(() => DEFAULT_SYSTEM_SETTINGS),
    ]);
    setProducts(prods);
    setSuppliers(supps);
    setTransactions(txns);
    setInvoices(invs);
    setSystemSettings(sysSettings);

    if (user.role === 'Admin' || user.role === 'Auditor' || user.role === 'Warehouse_Manager') {
      const usrs = await usersApi.getAll();
      setUsers(usrs);
    }
  };

  const refreshSystemSettings = useCallback(async () => {
    try { setSystemSettings(await settingsApi.get()); } catch { /* keep current value */ }
  }, []);

  // Callable refresh — pages can call this after mutations so others see changes sooner
  const refreshData = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) return;
    try { await loadAllData(user); } catch { /* ignore background refresh errors */ }
  }, []);

  // On app start — check if stored session is still valid
  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      setIsInitializing(false);
      return;
    }

    authApi.getMe()
      .then(async (user) => {
        setCurrentUser(user);
        setStoredUser(user);
        try { await loadAllData(user); } catch { /* data load failed — keep user logged in with empty state */ }
      })
      .catch(() => {
        setStoredUser(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  // Poll every 15 s — keeps all open tabs/users in sync automatically
  useEffect(() => {
    const id = setInterval(() => {
      if (currentUserRef.current) refreshData();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshData]);

  // Refresh immediately when the user switches back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && currentUserRef.current) refreshData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshData]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      if (result && (result as any).requires2FA) {
        setIsLoading(false);
        return { success: false, requires2FA: true, email: (result as any).email as string };
      }
      const user = result;
      setCurrentUser(user);
      setStoredUser(user);
      await loadAllData(user);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  const verify2FA = useCallback(async (email: string, code: string): Promise<boolean> => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const user = await authApi.verify2FA(email, code);
      setCurrentUser(user);
      setStoredUser(user);
      await loadAllData(user);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setLoginError(err.message || 'Invalid or expired code');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setStoredUser(null);
    setCurrentUser(null);
    setProducts([]);
    setSuppliers([]);
    setTransactions([]);
    setInvoices([]);
    setUsers([]);
    setUserActivityLogs([]);
    setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
  }, []);

  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoading,
        isInitializing,
        login,
        verify2FA,
        logout,
        loginError,
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
        setUserActivityLogs,
        invoices,
        setInvoices,
        systemSettings,
        refreshSystemSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};