import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Supplier } from '../types';
import { SupplierModal } from '../components/SupplierModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { suppliersApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface SuppliersPageProps {
  suppliers: Supplier[];
  onSuppliersChange: (suppliers: Supplier[]) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, onSuppliersChange }) => {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Role checks
  const isAdmin = currentUser?.role === 'Admin';
  const isWarehouseManager = currentUser?.role === 'Warehouse_Manager';
  const canAddEditSuppliers = isAdmin || isWarehouseManager;
  const canDeleteSuppliers = isAdmin;

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.includes(searchTerm)
  );

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    if (!canAddEditSuppliers) return;
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
  };

  const confirmDelete = async () => {
    if (!deletingSupplier) return;
    setIsLoading(true);
    try {
      await suppliersApi.delete(deletingSupplier.id);
      const updated = await suppliersApi.getAll();
      onSuppliersChange(updated);
      toast.success(`Supplier "${deletingSupplier.name}" deleted successfully`);
      setDeletingSupplier(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete supplier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSupplier = async (supplier: Supplier) => {
    setIsLoading(true);
    try {
      if (editingSupplier) {
        const { id, createdAt, updatedAt, productsSupplied, ...updateData } = supplier as any;
        await suppliersApi.update(supplier.id, updateData);
        toast.success(`Supplier "${supplier.name}" updated successfully`);
      } else {
        const { id, createdAt, updatedAt, productsSupplied, ...createData } = supplier as any;
        await suppliersApi.create(createData);
        toast.success(`Supplier "${supplier.name}" added successfully`);
      }
      const updated = await suppliersApi.getAll();
      onSuppliersChange(updated);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save supplier');
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
        <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
        {canAddEditSuppliers && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddSupplier} className="bg-[#1E90FF] hover:bg-[#1873CC]">
              <Plus className="w-4 h-4 mr-2" /> Add Supplier
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search suppliers by name, email, or contact..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
        {filteredSuppliers.length === 0 ? (
          <motion.div className="col-span-full text-center text-gray-500 py-12" variants={itemVariants}>No suppliers found</motion.div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <motion.div key={supplier.id} variants={itemVariants} whileHover={{ scale: 1.03, y: -8 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400 }}>
              <Card className={`h-full transition-shadow hover:shadow-lg ${canAddEditSuppliers ? 'cursor-pointer' : ''}`} onClick={() => canAddEditSuppliers && handleEditSupplier(supplier)}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {supplier.productsSupplied.slice(0, 2).map((product, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {product.length > 20 ? product.substring(0, 20) + '...' : product}
                          </Badge>
                        ))}
                        {supplier.productsSupplied.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{supplier.productsSupplied.length - 2} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /><span>{supplier.contact}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /><span className="truncate">{supplier.email}</span></div>
                      <div className="flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 mt-0.5" /><span className="flex-1">{supplier.address}</span></div>
                    </div>
                    {(canAddEditSuppliers || canDeleteSuppliers) && (
                      <div className="flex items-center gap-2 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                        {canAddEditSuppliers && (
                          <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm" onClick={() => handleEditSupplier(supplier)} className="w-full" disabled={isLoading}>
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                          </motion.div>
                        )}
                        {canDeleteSuppliers && (
                          <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSupplier(supplier)} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" disabled={isLoading}>
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {canAddEditSuppliers && (
        <SupplierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSupplier} supplier={editingSupplier} />
      )}
      {canDeleteSuppliers && (
        <DeleteConfirmModal isOpen={!!deletingSupplier} onClose={() => setDeletingSupplier(null)} onConfirm={confirmDelete} itemName={deletingSupplier?.name || ''} itemType="supplier" />
      )}
    </motion.div>
  );
};
