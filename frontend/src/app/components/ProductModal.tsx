import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Product, PRODUCT_CATEGORIES } from '../types';
import { useApp } from '../context/AppContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const { suppliers } = useApp();
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    category: 'Electronics',
    unit: 'Piece',
    costPrice: 0,
    stockQuantity: 0,
    minStock: 0,
    status: 'Active',
    hasExpiration: false,
    expirationDate: '',
    supplierId: '',
  });

  // Categories that typically need expiration tracking
  const perishableCategories = ['Dry Food', 'Fresh Food', 'Frozen Food', 'Beverages', 'Healthcare', 'Personal Care'];

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        sku: '',
        name: '',
        category: 'Electronics',
        unit: 'Piece',
        costPrice: 0,
        stockQuantity: 0,
        minStock: 0,
        status: 'Active',
        hasExpiration: false,
        expirationDate: '',
        supplierId: '',
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: product?.id || Date.now().toString(),
      sku: formData.sku || '',
      name: formData.name || '',
      category: formData.category || 'Electronics',
      unit: formData.unit || 'Piece',
      costPrice: Number(formData.costPrice) || 0,
      stockQuantity: Number(formData.stockQuantity) || 0,
      minStock: Number(formData.minStock) || 0,
      status: formData.status || 'Active',
      hasExpiration: formData.hasExpiration || false,
      expirationDate: formData.hasExpiration ? formData.expirationDate : undefined,
      supplierId: formData.supplierId || null,
    };
    onSave(productData);
  };

  const handleCategoryChange = (category: string) => {
    const needsExpiration = perishableCategories.includes(category);
    setFormData({ 
      ...formData, 
      category,
      hasExpiration: needsExpiration,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock *</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplierId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supplier</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiration Tracking Toggle */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.hasExpiration}
                  onChange={(e) => setFormData({ ...formData, hasExpiration: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">
                  Track Expiration Date
                  {perishableCategories.includes(formData.category || '') && (
                    <span className="ml-2 text-xs text-blue-600">(Recommended for {formData.category})</span>
                  )}
                </span>
              </label>
            </div>
            
            {formData.hasExpiration && (
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  required={formData.hasExpiration}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {product ? 'Update' : 'Add'} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};