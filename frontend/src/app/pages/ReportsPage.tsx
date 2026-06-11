import React, { useState, useMemo } from 'react';
import { Download, FileText, TrendingUp, Package, BarChart3, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Product, StockTransaction, Supplier, AuditLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { motion } from 'motion/react';


interface ReportsPageProps {
  products: Product[];
  transactions: StockTransaction[];
  suppliers: Supplier[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ products, transactions, suppliers }) => {
  const [dateRange, setDateRange] = useState('last30days');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentReportType, setCurrentReportType] = useState('');
  const [currentReportData, setCurrentReportData] = useState<any[]>([]);
  const [currentReportColumns, setCurrentReportColumns] = useState<{ key: string; label: string }[]>([]);

  const handleExport = (reportType: string, data: any[], columns: { key: string; label: string }[]) => {
    setCurrentReportType(reportType);
    setCurrentReportData(data);
    setCurrentReportColumns(columns);
    setPreviewModalOpen(true);
  };

  // Inventory Management Metrics
  const stockSummary = products.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.category,
    stock: p.stockQuantity,
    value: p.stockQuantity * p.costPrice,
    minStock: p.minStock,
    status: p.stockQuantity < p.minStock ? 'Critical' : p.stockQuantity < (p.minStock * 1.5) ? 'Low' : 'Optimal',
    turnoverRate: 'N/A',
  }));

  const totalStockValue = stockSummary.reduce((sum, item) => sum + item.value, 0);
  const criticalItems = stockSummary.filter(item => item.status === 'Critical').length;
  const avgStockLevel = products.length > 0 ? products.reduce((sum, p) => sum + p.stockQuantity, 0) / products.length : 0;

  // Filter transactions by the selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let cutoff: Date;
    switch (dateRange) {
      case 'today':
        cutoff = startOfToday;
        break;
      case 'last7days':
        cutoff = new Date(startOfToday);
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'last30days':
        cutoff = new Date(startOfToday);
        cutoff.setDate(cutoff.getDate() - 30);
        break;
      case 'last90days':
        cutoff = new Date(startOfToday);
        cutoff.setDate(cutoff.getDate() - 90);
        break;
      case 'thisyear':
        cutoff = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, dateRange]);

  // Stock Movement Analytics
  const stockMovementByProduct = useMemo(() => filteredTransactions.reduce((acc, t) => {
    const existing = acc.find(item => item.product === t.productName);
    if (existing) {
      if (t.type === 'IN') existing.stockIn += t.quantity;
      else existing.stockOut += t.quantity;
      existing.netMovement = existing.stockIn - existing.stockOut;
    } else {
      acc.push({
        product: t.productName,
        stockIn: t.type === 'IN' ? t.quantity : 0,
        stockOut: t.type === 'OUT' ? t.quantity : 0,
        netMovement: t.type === 'IN' ? t.quantity : -t.quantity,
      });
    }
    return acc;
  }, [] as { product: string; stockIn: number; stockOut: number; netMovement: number }[]), [filteredTransactions]);

  // Category Performance Analysis
  const categoryData = useMemo(() => products.reduce((acc, p) => {
    const existing = acc.find(item => item.category === p.category);
    if (existing) {
      existing.items += 1;
      existing.totalValue += p.stockQuantity * p.costPrice;
      existing.totalUnits += p.stockQuantity;
      existing.lowStockItems += p.stockQuantity < p.minStock ? 1 : 0;
    } else {
      acc.push({
        name: p.category,
        category: p.category,
        items: 1,
        totalValue: p.stockQuantity * p.costPrice,
        totalUnits: p.stockQuantity,
        lowStockItems: p.stockQuantity < p.minStock ? 1 : 0,
      });
    }
    return acc;
  }, [] as { name: string; category: string; items: number; totalValue: number; totalUnits: number; lowStockItems: number }[]), [products]);

  // Supplier Performance
  const supplierPerformance = useMemo(() => suppliers.map(supplier => {
    const suppliedProducts = products.filter(p => p.supplierId === supplier.id);
    const totalValue = suppliedProducts.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);
    return {
      name: supplier.name,
      productCount: suppliedProducts.length,
      totalValue,
      activeProducts: suppliedProducts.filter(p => p.status === 'Active').length,
      contact: supplier.contact,
      email: supplier.email,
    };
  }), [products, suppliers]);

  // Audit Trail derived from stock transactions
  const auditTrail = useMemo<AuditLog[]>(() => {
    return filteredTransactions.map(t => ({
      id: t.id,
      timestamp: new Date(t.date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      action: `Stock ${t.type}`,
      user: t.userName || t.user || '—',
      details: [
        t.productName,
        `Qty: ${t.quantity}`,
        `Warehouse: ${t.warehouse}`,
        t.note ? `Note: ${t.note}` : null,
        `Status: ${t.status}`,
      ].filter(Boolean).join(' | '),
    }));
  }, [filteredTransactions]);

  const COLORS = ['#1E90FF', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Management Reports</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="thisyear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <motion.div variants={itemVariants}>
          <TabsList>
            <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
            <TabsTrigger value="movement">Stock Movement</TabsTrigger>
            <TabsTrigger value="categories">Category Performance</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Inventory Analysis Report */}
        <TabsContent value="inventory" className="space-y-6">
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold">Inventory Analysis Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('Inventory Analysis', stockSummary, [
                { key: 'sku', label: 'SKU' },
                { key: 'name', label: 'Product Name' },
                { key: 'category', label: 'Category' },
                { key: 'stock', label: 'Stock Qty' },
                { key: 'value', label: 'Stock Value' },
                { key: 'status', label: 'Status' },
                { key: 'turnoverRate', label: 'Turnover Rate' },
              ])}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }}>
              <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Stock Value</p>
                    <p className="text-2xl font-semibold mt-1">${totalStockValue.toFixed(2)}</p>
                  </div>
                  <Package className="w-10 h-10 text-[#1E90FF]" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }}>
              <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-semibold mt-1">{products.length}</p>
                  </div>
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }}>
              <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Critical Stock Items</p>
                    <p className="text-2xl font-semibold mt-1 text-[#FF4C4C]">
                      {criticalItems}
                    </p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-[#FF4C4C]" />
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
              <Card>
              <CardHeader>
                <CardTitle>Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div key="reports-pie-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart id="reports-category-pie">
                      <Pie
                        key="pie-category"
                        data={categoryData}
                        dataKey="items"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                        id="reports-pie-items"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip key="pie-tooltip" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }}>
              <Card>
              <CardHeader>
                <CardTitle>Stock Value by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div key="reports-value-bar-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} id="reports-category-value-bar">
                      <CartesianGrid key="value-bar-grid" strokeDasharray="3 3" />
                      <XAxis key="value-bar-xaxis" dataKey="category" />
                      <YAxis key="value-bar-yaxis" />
                      <Tooltip key="value-bar-tooltip" />
                      <Bar key="value-bar-total" dataKey="totalValue" fill="#1E90FF" id="reports-bar-value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
            <CardHeader>
              <CardTitle>Detailed Stock Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Qty</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Turnover Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>${item.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Critical' ? 'destructive' : item.status === 'Low' ? 'warning' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.turnoverRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Stock Movement Report */}
        <TabsContent value="movement" className="space-y-6">
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold">Stock Movement Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('Stock Movement', stockMovementByProduct, [
                { key: 'product', label: 'Product' },
                { key: 'stockIn', label: 'Stock In' },
                { key: 'stockOut', label: 'Stock Out' },
                { key: 'netMovement', label: 'Net Movement' },
              ])}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
              <CardHeader>
                <CardTitle>Stock In vs Stock Out</CardTitle>
              </CardHeader>
            <CardContent>
              <div key="reports-movement-bar-chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stockMovementByProduct} id="reports-stock-movement-bar">
                    <CartesianGrid key="movement-bar-grid" strokeDasharray="3 3" />
                    <XAxis key="movement-bar-xaxis" dataKey="product" angle={-45} textAnchor="end" height={100} />
                    <YAxis key="movement-bar-yaxis" />
                    <Tooltip key="movement-bar-tooltip" />
                    <Legend key="movement-bar-legend" />
                    <Bar key="movement-bar-stockin" dataKey="stockIn" fill="#00C49F" name="Stock In" id="reports-bar-in" />
                    <Bar key="movement-bar-stockout" dataKey="stockOut" fill="#FF8042" name="Stock Out" id="reports-bar-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No transactions found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>{transaction.productName}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'IN' ? 'default' : transaction.type === 'OUT' ? 'destructive' : 'secondary'}
                            className={transaction.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : transaction.type === 'SHRINKAGE' ? 'bg-orange-100 text-orange-700' : ''}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{transaction.warehouse}</TableCell>
                        <TableCell>{transaction.userName || transaction.user || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Category Performance Report */}
        <TabsContent value="categories" className="space-y-6">
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold">Category Performance Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('Category Performance', categoryData, [
                { key: 'category', label: 'Category' },
                { key: 'items', label: 'Items' },
                { key: 'totalValue', label: 'Total Value' },
                { key: 'totalUnits', label: 'Total Units' },
                { key: 'lowStockItems', label: 'Low Stock Items' },
              ])}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Total Units</TableHead>
                    <TableHead>Low Stock Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((category) => (
                    <TableRow key={category.category}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell>{category.items}</TableCell>
                      <TableCell>${category.totalValue.toFixed(2)}</TableCell>
                      <TableCell>{category.totalUnits}</TableCell>
                      <TableCell>{category.lowStockItems}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Supplier Analytics Report */}
        <TabsContent value="suppliers" className="space-y-6">
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold">Supplier Analytics Report</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Supplier Analytics', supplierPerformance, [
              { key: 'name', label: 'Supplier Name' },
              { key: 'contact', label: 'Contact' },
              { key: 'email', label: 'Email' },
              { key: 'productCount', label: 'Products Count' },
              { key: 'totalValue', label: 'Total Value' },
              { key: 'activeProducts', label: 'Active Products' },
            ])}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
              <CardHeader>
                <CardTitle>Supplier List</CardTitle>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Products Count</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Active Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPerformance.map((supplier) => (
                    <TableRow key={supplier.name}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.productCount}</TableCell>
                      <TableCell className="max-w-xs truncate">${supplier.totalValue.toFixed(2)}</TableCell>
                      <TableCell>{supplier.activeProducts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold">Audit Logs</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Audit Logs', auditTrail, [
              { key: 'timestamp', label: 'Timestamp' },
              { key: 'action', label: 'Action' },
              { key: 'user', label: 'User' },
              { key: 'details', label: 'Details' },
            ])}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
            <Card>
              <CardHeader>
                <CardTitle>System Activity Log</CardTitle>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditTrail.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No activity found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditTrail.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge>{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell className="text-xs text-gray-600">{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <ReportPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        reportType={currentReportType}
        reportData={currentReportData}
        columns={currentReportColumns}
      />
    </motion.div>
  );
};