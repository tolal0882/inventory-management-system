import React, { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Invoice, Supplier, Product, User } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { InvoiceDetailsModal } from '../components/InvoiceDetailsModal';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { invoicesApi } from '../services/api';

interface InvoicesPageProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  products: Product[];
  currentUser: User | null;
  onInvoicesChange: (invoices: Invoice[]) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  invoices, suppliers, products, currentUser, onInvoicesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Role checks
  const isAdmin = currentUser?.role === 'Admin';
  const isWarehouseManager = currentUser?.role === 'Warehouse_Manager';
  const canCreateEditInvoices = isAdmin || isWarehouseManager;

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (!canCreateEditInvoices) return;
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      if (editingInvoice) {
        const { id, invoiceNumber, createdBy, createdAt, updatedAt, items, supplierId, supplierName, ...updateData } = invoice as any;
        await invoicesApi.update(invoice.id, updateData);
        toast.success(`Invoice updated successfully`);
      } else {
        const { id, invoiceNumber, createdBy, createdAt, updatedAt, ...createData } = invoice as any;
        await invoicesApi.create(createData);
        toast.success(`Invoice created successfully`);
      }
      const updated = await invoicesApi.getAll();
      onInvoicesChange(updated);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
        <h1 className="text-2xl font-semibold text-gray-900">Supplier Invoices</h1>
        {canCreateEditInvoices && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddInvoice} className="bg-[#1E90FF] hover:bg-[#1873CC]">
              <Plus className="w-4 h-4 mr-2" /> Create Invoice
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search invoices by number, supplier, or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </motion.div>

      <motion.div className="bg-white rounded-lg border border-gray-200 overflow-hidden" variants={itemVariants} whileHover={{ scale: 1.005 }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-8">No invoices found</TableCell></TableRow>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewInvoice(invoice)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    component={TableRow as any}
                  >
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.supplierName}</TableCell>
                    <TableCell>{invoice.invoiceDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell className="font-medium">${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge></TableCell>
                    <TableCell>{invoice.createdBy}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {canCreateEditInvoices && (
        <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveInvoice} invoice={editingInvoice} suppliers={suppliers} products={products} currentUserName={currentUser?.name || 'Unknown'} />
      )}
      <InvoiceDetailsModal isOpen={viewingInvoice !== null} onClose={() => setViewingInvoice(null)} invoice={viewingInvoice} onEdit={canCreateEditInvoices ? handleEditInvoice : undefined} />
    </motion.div>
  );
};
