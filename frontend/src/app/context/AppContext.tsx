import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Product, Supplier, StockTransaction, UserActivityLog, Invoice } from '../types';
import { authApi, productsApi, suppliersApi, transactionsApi, usersApi, invoicesApi } from '../services/api';

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

interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginError: string | null;
  updateCurrentUser: (user: User) => void;
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

  // Helper to load all data based on role
  const loadAllData = async (user: User) => {
    const [prods, supps, txns, invs] = await Promise.all([
      productsApi.getAll(),
      suppliersApi.getAll(),
      transactionsApi.getAll(),
      invoicesApi.getAll(),
    ]);
    setProducts(prods);
    setSuppliers(supps);
    setTransactions(txns);
    setInvoices(invs);

    // Admin, Auditor, and Warehouse_Manager can load users list
    if (user.role === 'Admin' || user.role === 'Auditor' || user.role === 'Warehouse_Manager') {
      const usrs = await usersApi.getAll();
      setUsers(usrs);
    }
  };

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

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const user = await authApi.login(email, password);
      setCurrentUser(user);
      setStoredUser(user);
      await loadAllData(user);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
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
        logout,
        loginError,
        updateCurrentUser,
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