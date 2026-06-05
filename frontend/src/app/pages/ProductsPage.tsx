import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, QrCode, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Product, Supplier, PurchaseOrder } from '../types';
import { ProductModal } from '../components/ProductModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { productsApi, purchaseOrdersApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface ProductsPageProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  suppliers?: Supplier[];
  onPurchaseOrderCreate?: (order: PurchaseOrder) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onProductsChange,
  suppliers = [],
  onPurchaseOrderCreate,
}) => {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [orderingProductId, setOrderingProductId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Role checks
  const isAdmin = currentUser?.role === 'Admin';
  const isInventoryStaff = currentUser?.role === 'Inventory_Staff';
  const isWarehouseManager = currentUser?.role === 'Warehouse_Manager';

  const canAddEditProducts = isAdmin || isWarehouseManager;
  const canDeleteProducts = isAdmin;
  const canCreatePurchaseOrder = isAdmin || isWarehouseManager;

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && product.stockQuantity < product.minStock) ||
                        (stockFilter === 'normal' && product.stockQuantity >= product.minStock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!canAddEditProducts) return;
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setIsLoading(true);
    try {
      await productsApi.delete(deletingProduct.id);
      const updated = await productsApi.getAll();
      onProductsChange(updated);
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    setIsLoading(true);
    try {
      if (editingProduct) {
        const { id, createdAt, updatedAt, ...updateData } = product as any;
        await productsApi.update(product.id, updateData);
        toast.success(`Product "${product.name}" updated successfully`);
      } else {
        const { id, createdAt, updatedAt, ...createData } = product as any;
        await productsApi.create(createData);
        toast.success(`Product "${product.name}" added successfully`);
      }
      const updated = await productsApi.getAll();
      onProductsChange(updated);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = (productId: string) => {
    setOrderingProductId(productId);
    setIsPurchaseOrderModalOpen(true);
  };

  const handlePurchaseOrderCreate = async (orderData: any) => {
    setIsLoading(true);
    try {
      const created = await purchaseOrdersApi.create({
        ...orderData,
        totalAmount: orderData.quantity * orderData.unitPrice,
        status: 'Draft',
      });
      toast.success(`Purchase order created for ${orderData.productName}`);
      setIsPurchaseOrderModalOpen(false);
      setOrderingProductId(undefined);
      if (onPurchaseOrderCreate) onPurchaseOrderCreate(created);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        {canAddEditProducts && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddProduct} className="bg-[#1E90FF] hover:bg-[#1873CC]">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search by product name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Stock Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="normal">Normal Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div className="bg-white rounded-lg border border-gray-200 overflow-hidden" variants={itemVariants} whileHover={{ scale: 1.005 }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Stock Qty</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-gray-500 py-8">No products found</TableCell></TableRow>
              ) : (
                filteredProducts.map((product, index) => {
                  const isLowStock = product.stockQuantity < product.minStock;
                  return (
                    <motion.tr
                      key={product.id}
                      className={`${canAddEditProducts ? 'cursor-pointer' : 'cursor-default'} ${isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                      onClick={() => canAddEditProducts && handleEditProduct(product)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      component={TableRow as any}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-gray-400" />{product.sku}</div>
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>${product.costPrice.toFixed(2)}</TableCell>
                      <TableCell><span className={isLowStock ? 'text-[#FF4C4C] font-semibold' : ''}>{product.stockQuantity}</span></TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell><Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>{product.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {canAddEditProducts && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                          {canDeleteProducts && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                          {canCreatePurchaseOrder && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" onClick={() => handleCreateOrder(product.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {canAddEditProducts && (
        <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} product={editingProduct} />
      )}
      {canDeleteProducts && (
        <DeleteConfirmModal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} onConfirm={confirmDelete} itemName={deletingProduct?.name || ''} itemType="product" />
      )}
      {canCreatePurchaseOrder && (
        <PurchaseOrderModal
          isOpen={isPurchaseOrderModalOpen}
          onClose={() => { setIsPurchaseOrderModalOpen(false); setOrderingProductId(undefined); }}
          onSubmit={handlePurchaseOrderCreate}
          products={products}
          suppliers={suppliers}
          preselectedProductId={orderingProductId}
        />
      )}
    </motion.div>
  );
};
