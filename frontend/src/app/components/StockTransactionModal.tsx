import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Product, StockTransaction, User } from '../types';

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: StockTransaction) => void;
  products: Product[];
  transactionType: 'IN' | 'OUT';
  currentUser: User | null;
}

export const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
  transactionType,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    warehouse: 'Main Warehouse',
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const transaction: StockTransaction = {
      id: Date.now().toString(),
      productId: formData.productId,
      productName: product.name,
      type: transactionType,
      quantity: formData.quantity,
      warehouse: formData.warehouse,
      date: new Date().toISOString().split('T')[0],
      user: currentUser?.name || 'Unknown',
      note: formData.note,
      status: 'Pending',
    };

    onSave(transaction);
    setFormData({
      productId: '',
      quantity: 0,
      warehouse: 'Main Warehouse',
      note: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Stock: {product.stockQuantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select
                value={formData.warehouse}
                onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                  <SelectItem value="Secondary Warehouse">Secondary Warehouse</SelectItem>
                  <SelectItem value="Storage Area A">Storage Area A</SelectItem>
                  <SelectItem value="Storage Area B">Storage Area B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add any notes about this transaction..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={transactionType === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              Submit {transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
