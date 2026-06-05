import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, Package, Truck, FileText, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StockTransaction, Supplier, Invoice } from '../types';
import { NotificationsDropdown } from './NotificationsDropdown';

interface TopBarProps {
  onMenuToggle: () => void;
  products?: Product[];
  transactions?: StockTransaction[];
  suppliers?: Supplier[];
  invoices?: Invoice[];
  onNavigate?: (page: string, itemId?: string) => void;
  currentPage?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  products = [],
  transactions = [],
  suppliers = [],
  invoices = [],
  onNavigate,
  currentPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return { products: [], suppliers: [], invoices: [], transactions: [] };

    const query = searchQuery.toLowerCase();

    const filteredProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    ).slice(0, 5);

    const filteredSuppliers = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.contact.toLowerCase().includes(query)
    ).slice(0, 3);

    const filteredInvoices = invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.supplierName.toLowerCase().includes(query)
    ).slice(0, 3);

    const filteredTransactions = transactions.filter(
      (t) =>
        t.productName.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
    ).slice(0, 3);

    return {
      products: filteredProducts,
      suppliers: filteredSuppliers,
      invoices: filteredInvoices,
      transactions: filteredTransactions,
    };
  };

  const results = getSearchResults();
  const hasResults =
    results.products.length > 0 ||
    results.suppliers.length > 0 ||
    results.invoices.length > 0 ||
    results.transactions.length > 0;

  const handleResultClick = (type: string, id?: string) => {
    if (onNavigate) {
      onNavigate(type, id);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all hover:rotate-90"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div ref={searchRef} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search products, SKU, or suppliers..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50"
                >
                  {!hasResults && (
                    <div className="p-4 text-center text-gray-500">
                      No results found for "{searchQuery}"
                    </div>
                  )}

                  {/* Products */}
                  {results.products.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        Products
                      </div>
                      {results.products.map((product) => (
                        <motion.button
                          key={product.id}
                          onClick={() => handleResultClick('products', product.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          whileHover={{ x: 5 }}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{product.name}</div>
                            <div className="text-xs text-gray-500">
                              SKU: {product.sku} • Stock: {product.stockQuantity}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Suppliers */}
                  {results.suppliers.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        Suppliers
                      </div>
                      {results.suppliers.map((supplier) => (
                        <motion.button
                          key={supplier.id}
                          onClick={() => handleResultClick('suppliers', supplier.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          whileHover={{ x: 5 }}
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{supplier.name}</div>
                            <div className="text-xs text-gray-500">{supplier.email}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Invoices */}
                  {results.invoices.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        Invoices
                      </div>
                      {results.invoices.map((invoice) => (
                        <motion.button
                          key={invoice.id}
                          onClick={() => handleResultClick('invoices', invoice.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          whileHover={{ x: 5 }}
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {invoice.supplierName} • ${invoice.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Recent Transactions */}
                  {results.transactions.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        Transactions
                      </div>
                      {results.transactions.map((transaction) => (
                        <motion.button
                          key={transaction.id}
                          onClick={() => handleResultClick('stock', transaction.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0"
                          whileHover={{ x: 5 }}
                        >
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {transaction.productName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.type} • Qty: {transaction.quantity}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section - Notifications only */}
        <div className="flex items-center">
          <NotificationsDropdown
            products={products}
            transactions={transactions}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </header>
  );
};