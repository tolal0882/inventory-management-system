import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Product, WAREHOUSES, User } from '../types';
import { AlertTriangle } from 'lucide-react';

interface ShrinkageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    productName: string;
    quantity: number;
    warehouse: string;
    shrinkageReason: 'Damaged' | 'Expired' | 'Lost' | 'Theft' | 'Other';
    note: string;
  }) => void;
  products: Product[];
  currentUser: User | null;
}

export const ShrinkageModal: React.FC<ShrinkageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    warehouse: '',
    shrinkageReason: '' as 'Damaged' | 'Expired' | 'Lost' | 'Theft' | 'Other' | '',
    note: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProduct = products.find(p => p.id === formData.productId);
    
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!formData.shrinkageReason) {
      setError('Please select a shrinkage reason');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantity > selectedProduct.stockQuantity) {
      setError(`Cannot record shrinkage of ${quantity} units. Only ${selectedProduct.stockQuantity} units available.`);
      return;
    }

    onSubmit({
      productId: formData.productId,
      productName: selectedProduct.name,
      quantity,
      warehouse: formData.warehouse,
      shrinkageReason: formData.shrinkageReason as 'Damaged' | 'Expired' | 'Lost' | 'Theft' | 'Other',
      note: formData.note,
    });

    // Reset form
    setFormData({
      productId: '',
      quantity: '',
      warehouse: '',
      shrinkageReason: '',
      note: '',
    });
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Record Stock Shrinkage
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> Shrinkage reduces inventory without generating revenue. 
              This is used for damaged, expired, lost, or stolen items.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product">Product *</Label>
              <select
                id="product"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">Select Product</option>
                {products
                  .filter(p => p.status === 'Active' && p.stockQuantity > 0)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (SKU: {product.sku}) - Available: {product.stockQuantity}
                    </option>
                  ))}
              </select>
            </div>

            {/* Shrinkage Reason */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shrinkageReason">Shrinkage Reason *</Label>
              <select
                id="shrinkageReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.shrinkageReason}
                onChange={(e) => setFormData({ ...formData, shrinkageReason: e.target.value as any })}
                required
              >
                <option value="">Select Reason</option>
                <option value="Damaged">Damaged - Product is broken or unusable</option>
                <option value="Expired">Expired - Product has passed expiration date</option>
                <option value="Lost">Lost - Product cannot be located</option>
                <option value="Theft">Theft - Product was stolen</option>
                <option value="Other">Other - See notes for details</option>
              </select>
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <select
                id="warehouse"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                required
              >
                <option value="">Select Warehouse</option>
                {WAREHOUSES.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity lost"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            {/* Detailed Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Detailed Notes *</Label>
              <textarea
                id="note"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Provide detailed explanation of the shrinkage incident (required for audit trail)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Warning Summary */}
          {formData.quantity && formData.productId && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-sm text-red-900 mb-2">⚠️ Shrinkage Impact</h4>
              <p className="text-sm text-red-800">
                This will reduce inventory by <strong>{formData.quantity} units</strong> without generating any revenue.
                This action should only be used for legitimate inventory losses.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Record Shrinkage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};