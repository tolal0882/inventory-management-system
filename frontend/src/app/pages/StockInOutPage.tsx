import React, { useState } from 'react';
import { Plus, CheckCircle, XCircle, ArrowRightLeft, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Product, StockTransaction, User } from '../types';
import { StockTransactionModal } from '../components/StockTransactionModal';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { TransferModal } from '../components/TransferModal';
import { ShrinkageModal } from '../components/ShrinkageModal';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { transactionsApi, productsApi } from '../services/api';

interface StockInOutPageProps {
  products: Product[];
  transactions: StockTransaction[];
  currentUser: User | null;
  onTransactionsChange: (transactions: StockTransaction[]) => void;
  onProductsChange: (products: Product[]) => void;
}

export const StockInOutPage: React.FC<StockInOutPageProps> = ({
  products,
  transactions,
  currentUser,
  onTransactionsChange,
  onProductsChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isShrinkageModalOpen, setIsShrinkageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRejectTx, setPendingRejectTx] = useState<StockTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Role checks
  const isAdmin = currentUser?.role === 'Admin';
  const isWarehouseManager = currentUser?.role === 'Warehouse_Manager';
  const isInventoryStaff = currentUser?.role === 'Inventory_Staff';
  const isAuditor = currentUser?.role === 'Auditor';

  const canCreateTransactions = isAdmin || isInventoryStaff || isWarehouseManager;
  const canSubmitShrinkage = isAdmin || isWarehouseManager;
  const canApprove = isAdmin || isWarehouseManager;

  // Shrinkage requires Admin-only approval — WM cannot approve their own submissions
  const canApproveTransaction = (tx: StockTransaction) =>
    tx.type === 'SHRINKAGE' ? isAdmin : canApprove;

  const refreshData = async () => {
    const [txns, prods] = await Promise.all([
      transactionsApi.getAll(),
      productsApi.getAll(),
    ]);
    onTransactionsChange(txns);
    onProductsChange(prods);
  };

  const handleAddTransaction = (type: 'IN' | 'OUT') => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (transaction: StockTransaction) => {
    setIsLoading(true);
    try {
      await transactionsApi.create({
        productId: transaction.productId,
        type: transaction.type,
        quantity: transaction.quantity,
        warehouse: transaction.warehouse,
        note: transaction.note,
      });
      await refreshData();
      toast.success('Transaction submitted — waiting for approval');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (transaction: StockTransaction) => {
    setIsLoading(true);
    try {
      await transactionsApi.updateStatus(transaction.id, 'Approved');
      await refreshData();
      toast.success('Transaction approved — stock updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = (transaction: StockTransaction) => {
    setPendingRejectTx(transaction);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!pendingRejectTx) return;
    setIsLoading(true);
    try {
      await transactionsApi.updateStatus(pendingRejectTx.id, 'Rejected', rejectReason.trim() || undefined);
      await refreshData();
      toast.success('Transaction rejected');
      setPendingRejectTx(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTransaction = (transaction: StockTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handleEditTransaction = (transaction: StockTransaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, data: { quantity?: number; warehouse?: string; note?: string }) => {
    setIsLoading(true);
    try {
      await transactionsApi.update(id, data);
      await refreshData();
      toast.success('Transaction updated');
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await transactionsApi.create({
        productId: data.productId,
        type: 'TRANSFER',
        quantity: data.quantity,
        warehouse: data.fromWarehouse,
        fromWarehouse: data.fromWarehouse,
        toWarehouse: data.toWarehouse,
        note: data.note,
      });
      await refreshData();
      toast.success('Transfer submitted — waiting for approval');
      setIsTransferModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShrinkageSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await transactionsApi.create({
        productId: data.productId,
        type: 'SHRINKAGE',
        quantity: data.quantity,
        warehouse: data.warehouse,
        shrinkageReason: data.shrinkageReason,
        note: data.note,
      });
      await refreshData();
      toast.success('Shrinkage submitted — waiting for Admin approval');
      setIsShrinkageModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit shrinkage');
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
      <motion.div className="flex items-center justify-between flex-wrap gap-4" variants={itemVariants}>
        <h1 className="text-2xl font-semibold text-gray-900">Stock In / Stock Out</h1>
        {canCreateTransactions && (
          <div className="flex gap-2 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => handleAddTransaction('IN')} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Stock In
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => handleAddTransaction('OUT')} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" /> Stock Out
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setIsTransferModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
              </Button>
            </motion.div>
            {canSubmitShrinkage && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setIsShrinkageModalOpen(true)} variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Shrinkage
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Info banner for Inventory Staff */}
      {isInventoryStaff && (
        <motion.div variants={itemVariants} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          ℹ️ Your transactions will be submitted as <strong>Pending</strong> and require approval from a Warehouse Manager or Admin before stock is updated.
        </motion.div>
      )}

      <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
        <Card>
          <CardHeader><CardTitle>Stock Transactions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={canApprove ? 9 : 8} className="text-center text-gray-500 py-8">No transactions found</TableCell></TableRow>
                  ) : (
                    transactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        component={TableRow as any}
                      >
                        <TableCell className="font-medium">{transaction.productName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.type === 'IN' ? 'default' : transaction.type === 'OUT' ? 'destructive' : transaction.type === 'TRANSFER' ? 'secondary' : 'outline'}
                            className={transaction.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : transaction.type === 'SHRINKAGE' ? 'bg-orange-100 text-orange-700' : ''}
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{transaction.warehouse}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="font-medium">
                          {transaction.userName || transaction.user || '—'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {transaction.note ? (
                            transaction.status === 'Rejected' ? (
                              <span className="flex items-center gap-1 text-red-600 text-xs">
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                <span className="truncate">{transaction.note}</span>
                              </span>
                            ) : (
                              <span className="text-gray-600 text-sm truncate block">{transaction.note}</span>
                            )
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'Approved' ? 'default' : transaction.status === 'Rejected' ? 'destructive' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        {canApprove && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {transaction.status === 'Pending' && (
                              canApproveTransaction(transaction) ? (
                                <div className="flex items-center gap-2">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" onClick={() => handleApprove(transaction)} className="text-green-600 hover:text-green-700 hover:bg-green-50" disabled={isLoading}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" onClick={() => handleReject(transaction)} className="text-red-600 hover:text-red-700 hover:bg-red-50" disabled={isLoading}>
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Admin only
                                </span>
                              )
                            )}
                          </TableCell>
                        )}
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {canCreateTransactions && (
        <>
          <StockTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTransaction} products={products} transactionType={transactionType} currentUser={currentUser} />
          <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} products={products} currentUser={currentUser} onSubmit={handleTransferSubmit} />
        </>
      )}
      {canSubmitShrinkage && (
        <ShrinkageModal isOpen={isShrinkageModalOpen} onClose={() => setIsShrinkageModalOpen(false)} products={products} currentUser={currentUser} onSubmit={handleShrinkageSubmit} />
      )}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
        currentUser={currentUser}
        onEdit={handleEditTransaction}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingTransaction(null); }}
        transaction={editingTransaction}
        onSave={handleSaveEdit}
        isLoading={isLoading}
      />

      {/* Reject Reason Dialog */}
      <Dialog open={!!pendingRejectTx} onOpenChange={(open) => { if (!open) { setPendingRejectTx(null); setRejectReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pendingRejectTx && (
              <p className="text-sm text-gray-600">
                Rejecting <span className="font-semibold">{pendingRejectTx.productName}</span> — {pendingRejectTx.quantity} units ({pendingRejectTx.type})
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason">Reason for rejection <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea
                id="rejectReason"
                rows={3}
                placeholder="Enter the reason why this transaction is being rejected…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingRejectTx(null); setRejectReason(''); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReject} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
              {isLoading ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
