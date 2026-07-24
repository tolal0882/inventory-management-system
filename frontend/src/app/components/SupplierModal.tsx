import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Supplier } from '../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  supplier: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSave, supplier }) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contact: '+855',
    email: '',
    address: '',
    productsSupplied: [],
  });

  const [productsInput, setProductsInput] = useState('');

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
      setProductsInput(supplier.productsSupplied.join(', '));
    } else {
      setFormData({
        name: '',
        contact: '+855',
        email: '',
        address: '',
        productsSupplied: [],
      });
      setProductsInput('');
    }
  }, [supplier, isOpen]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplierData: Supplier = {
      id: supplier?.id || Date.now().toString(),
      name: formData.name || '',
      contact: formData.contact || '+855',
      email: formData.email || '',
      address: formData.address || '',
      productsSupplied: productsInput.split(',').map(p => p.trim()).filter(p => p),
    };
    onSave(supplierData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+855 XX XXX XXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="products">Products Supplied</Label>
              <Textarea
                id="products"
                value={productsInput}
                onChange={(e) => setProductsInput(e.target.value)}
                placeholder="Enter product names separated by commas (e.g., Laptop, Monitor, Mouse)"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Separate multiple products with commas. New names are auto-created in the Products
                page with a generated SKU — just fill in the rest of the details there. Removing a
                name here unlinks that product from this supplier without deleting it.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {supplier ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};