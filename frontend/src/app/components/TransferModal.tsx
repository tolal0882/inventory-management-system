import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Product, WAREHOUSES, User } from '../types';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    productName: string;
    quantity: number;
    fromWarehouse: string;
    toWarehouse: string;
    note: string;
  }) => void;
  products: Product[];
  currentUser: User | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    fromWarehouse: '',
    toWarehouse: '',
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

    if (!formData.fromWarehouse || !formData.toWarehouse) {
      setError('Please select both warehouses');
      return;
    }

    if (formData.fromWarehouse === formData.toWarehouse) {
      setError('Source and destination warehouses must be different');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    onSubmit({
      productId: formData.productId,
      productName: selectedProduct.name,
      quantity,
      fromWarehouse: formData.fromWarehouse,
      toWarehouse: formData.toWarehouse,
      note: formData.note,
    });

    // Reset form
    setFormData({
      productId: '',
      quantity: '',
      fromWarehouse: '',
      toWarehouse: '',
      note: '',
    });
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            Transfer Stock Between Warehouses
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

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
                  .filter(p => p.status === 'Active')
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (SKU: {product.sku}) - Current Stock: {product.stockQuantity}
                    </option>
                  ))}
              </select>
            </div>

            {/* From Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="fromWarehouse">From Warehouse *</Label>
              <select
                id="fromWarehouse"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.fromWarehouse}
                onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                required
              >
                <option value="">Select Source</option>
                {WAREHOUSES.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>

            {/* To Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="toWarehouse">To Warehouse *</Label>
              <select
                id="toWarehouse"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.toWarehouse}
                onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                required
              >
                <option value="">Select Destination</option>
                {WAREHOUSES.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity to transfer"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Transfer Notes</Label>
              <textarea
                id="note"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter any notes about this transfer (e.g., reason, special instructions)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          {/* Transfer Summary */}
          {formData.fromWarehouse && formData.toWarehouse && formData.quantity && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Transfer Summary</h4>
              <div className="text-sm text-blue-800 flex items-center gap-2">
                <span className="font-medium">{formData.fromWarehouse}</span>
                <ArrowRightLeft className="w-4 h-4" />
                <span className="font-medium">{formData.toWarehouse}</span>
                <span className="ml-2">
                  ({formData.quantity} {formData.quantity === '1' ? 'unit' : 'units'})
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Transfer Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};