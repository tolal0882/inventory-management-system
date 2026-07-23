import React, { useMemo } from 'react';
import { Package, AlertTriangle, DollarSign, TrendingDown, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Product, StockTransaction, SystemSettings } from '../types';
import { Badge } from '../components/ui/badge';
import { motion } from 'motion/react';

interface DashboardPageProps {
  products: Product[];
  transactions: StockTransaction[];
  systemSettings?: SystemSettings;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ products, transactions, systemSettings }) => {
  // Calculate inventory management stats
  const thresholdPercent = systemSettings?.lowStockThresholdPercent ?? 0;
  const isLowStock = (p: Product) => p.stockQuantity < p.minStock * (1 + thresholdPercent / 100);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockItems = products.filter(isLowStock);
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);
  
  // Inventory turnover ratio (last 30 days)
  const recentTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return transactionDate >= thirtyDaysAgo;
  });
  
  const stockOut = recentTransactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);
  
  const stockIn = recentTransactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Chart data for inventory analysis
  const stockByCategory = useMemo(() => products.reduce((acc, product) => {
    const existing = acc.find(item => item.category === product.category);
    if (existing) {
      existing.stock += product.stockQuantity;
      existing.value += product.stockQuantity * product.costPrice;
    } else {
      acc.push({
        category: product.category,
        stock: product.stockQuantity,
        value: product.stockQuantity * product.costPrice
      });
    }
    return acc;
  }, [] as { category: string; stock: number; value: number }[]), [products]);

  const stockMovementData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const buckets: { month: string; stockIn: number; stockOut: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ month: monthNames[d.getMonth()], stockIn: 0, stockOut: 0 });
    }
    transactions.forEach(t => {
      const td = new Date(t.date);
      const diff = (now.getFullYear() - td.getFullYear()) * 12 + (now.getMonth() - td.getMonth());
      if (diff >= 0 && diff <= 5) {
        const bucket = buckets[5 - diff];
        if (t.type === 'IN') bucket.stockIn += t.quantity;
        else if (t.type === 'OUT') bucket.stockOut += t.quantity;
      }
    });
    return buckets;
  }, [transactions]);

  const COLORS = ['#1E90FF', '#00C49F', '#FFBB28', '#FF8042'];

  const recentTransactionsList = transactions.slice(0, 5);

  const expiringProducts = useMemo(() => {
    const now = new Date();
    return products
      .filter(p => p.hasExpiration && p.expirationDate)
      .map(p => {
        const expDate = new Date(p.expirationDate!);
        const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...p, daysLeft };
      })
      .filter(p => p.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 
        className="text-2xl font-semibold text-gray-900"
        variants={itemVariants}
      >
        Inventory Management Dashboard
      </motion.h1>

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Inventory Items</p>
                  <p className="text-3xl font-semibold mt-1">{totalProducts}</p>
                  <p className="text-xs text-green-600 mt-1">Active SKUs</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#1E90FF]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Stock Value</p>
                  <p className="text-3xl font-semibold mt-1">${totalStockValue.toFixed(0)}</p>
                  <p className="text-xs text-green-600 mt-1">Inventory worth</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Low Stock Alerts</p>
                  <p className="text-3xl font-semibold mt-1 text-[#FF4C4C]">{lowStockItems.length}</p>
                  <p className="text-xs text-red-600 mt-1">Needs reorder</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#FF4C4C]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Stock Movement (30d)</p>
                  <p className="text-3xl font-semibold mt-1">{stockOut}</p>
                  <p className="text-xs text-blue-600 mt-1">Items dispatched</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expiring Soon</p>
                  <p className="text-3xl font-semibold mt-1 text-amber-600">{expiringProducts.length}</p>
                  <p className="text-xs text-amber-600 mt-1">Within 30 days</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Stock by Category */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div key="dashboard-bar-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stockByCategory} id="dashboard-stock-by-category">
                    <CartesianGrid key="bar-grid" strokeDasharray="3 3" />
                    <XAxis key="bar-xaxis" dataKey="category" />
                    <YAxis key="bar-yaxis" />
                    <Tooltip key="bar-tooltip" />
                    <Bar key="bar-stock" dataKey="stock" fill="#1E90FF" id="dashboard-bar-stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stock Movement Trend */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div key="dashboard-line-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stockMovementData} id="dashboard-stock-movement">
                    <CartesianGrid key="line-grid" strokeDasharray="3 3" />
                    <XAxis key="line-xaxis" dataKey="month" />
                    <YAxis key="line-yaxis" />
                    <Tooltip key="line-tooltip" />
                    <Legend key="line-legend" />
                    <Line key="line-stockin" type="monotone" dataKey="stockIn" stroke="#00C49F" strokeWidth={2} name="Stock In" id="dashboard-line-in" />
                    <Line key="line-stockout" type="monotone" dataKey="stockOut" stroke="#FF8042" strokeWidth={2} name="Stock Out" id="dashboard-line-out" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Low Stock Alerts, Expiring Soon & Recent Transactions */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FF4C4C]" />
                Reorder Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">All inventory levels optimal</p>
                ) : (
                  lowStockItems.map((product) => (
                    <motion.div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      whileHover={{ scale: 1.02, x: 4 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#FF4C4C]">{product.stockQuantity} units</p>
                        <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiring Soon Alerts */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-500" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No products expiring within 30 days</p>
                ) : (
                  expiringProducts.map((product) => {
                    const isExpired = product.daysLeft < 0;
                    const isUrgent = product.daysLeft >= 0 && product.daysLeft <= 7;
                    const bgClass = isExpired
                      ? 'bg-red-50 border-red-200'
                      : isUrgent
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-amber-50 border-amber-200';
                    const labelClass = isExpired
                      ? 'text-red-600 font-semibold'
                      : isUrgent
                      ? 'text-orange-600 font-semibold'
                      : 'text-amber-600 font-semibold';
                    const label = isExpired
                      ? 'Expired'
                      : product.daysLeft === 0
                      ? 'Today'
                      : `${product.daysLeft}d left`;
                    return (
                      <motion.div
                        key={product.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${bgClass}`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${labelClass}`}>{label}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(product.expirationDate!).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactionsList.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.productName}</p>
                      <p className="text-xs text-gray-500">{transaction.date} • {transaction.userName || transaction.user || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'IN' ? 'default' : 'destructive'}>
                        {transaction.type}
                      </Badge>
                      <span className="font-semibold">{transaction.quantity}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};