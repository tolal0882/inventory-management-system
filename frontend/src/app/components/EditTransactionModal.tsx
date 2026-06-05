import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { StockTransaction, WAREHOUSES } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: StockTransaction | null;
  onSave: (id: string, data: { quantity?: number; warehouse?: string; note?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (transaction) {
      setQuantity(transaction.quantity.toString());
      setWarehouse(transaction.warehouse);
      setNote(transaction.note || '');
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(transaction.id, {
      quantity: parseInt(quantity, 10),
      warehouse,
      note,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-3">
            {/* Read-only summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Product</p>
                <p className="font-medium">{transaction.productName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Type</p>
                <Badge
                  variant={transaction.type === 'IN' ? 'default' : transaction.type === 'OUT' ? 'destructive' : 'secondary'}
                  className={transaction.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : transaction.type === 'SHRINKAGE' ? 'bg-orange-100 text-orange-700' : ''}
                >
                  {transaction.type}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Status</p>
                <Badge variant={transaction.status === 'Approved' ? 'default' : transaction.status === 'Rejected' ? 'destructive' : 'secondary'}>
                  {transaction.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Processed By</p>
                <p className="font-medium">{transaction.userName || transaction.user || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-qty">Quantity</Label>
                <Input
                  id="edit-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-warehouse">Warehouse</Label>
                <Select value={warehouse} onValueChange={setWarehouse} disabled={isLoading}>
                  <SelectTrigger id="edit-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {WAREHOUSES.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                className="resize-none"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
