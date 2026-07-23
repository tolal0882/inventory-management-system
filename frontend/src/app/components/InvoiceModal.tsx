import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Invoice, Supplier, Product } from '../types';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  invoice: Invoice | null;
  suppliers: Supplier[];
  products: Product[];
  currentUserName: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  invoice,
  suppliers,
  products,
  currentUserName
}) => {
  const emptyInvoice = (): Partial<Invoice> => ({
    invoiceNumber: '',
    supplierId: '',
    supplierName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    status: 'Draft',
    notes: '',
    createdBy: currentUserName,
    createdAt: new Date().toISOString()
  });

  const [formData, setFormData] = useState<Partial<Invoice>>(invoice || emptyInvoice());

  // Re-sync the form whenever a different invoice is opened for editing
  // (or the modal reopens for a fresh "Create") — without this, the modal
  // keeps stale data from whatever was open last instead of the invoice
  // that was actually clicked.
  useEffect(() => {
    if (isOpen) {
      setFormData(invoice || emptyInvoice());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, isOpen]);

  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const isLinkedToPurchaseOrder = !!formData.purchaseOrderId;

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData({
      ...formData,
      supplierId,
      supplierName: supplier?.name || ''
    });
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity <= 0 || unitPrice <= 0) {
      toast.error('Quantity and unit price must be greater than 0');
      return;
    }

    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice
    };

    const updatedItems = [...(formData.items || []), newItem];
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.10; // 10% tax
    const totalAmount = subtotal + tax;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      totalAmount
    });

    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
    toast.success('Product added to invoice');
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || [];
    const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.10;
    const totalAmount = subtotal + tax;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      tax,
      totalAmount
    });

    toast.success('Product removed from invoice');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.invoiceNumber || !formData.supplierId || !formData.invoiceDate || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      setError('Please add at least one product to the invoice');
      return;
    }

    const newInvoice: Invoice = {
      id: invoice?.id || Date.now().toString(),
      invoiceNumber: formData.invoiceNumber!,
      supplierId: formData.supplierId!,
      supplierName: formData.supplierName!,
      invoiceDate: formData.invoiceDate!,
      dueDate: formData.dueDate!,
      items: formData.items!,
      subtotal: formData.subtotal!,
      tax: formData.tax!,
      totalAmount: formData.totalAmount!,
      status: formData.status as any || 'Draft',
      notes: formData.notes || '',
      createdBy: formData.createdBy!,
      createdAt: formData.createdAt!,
      purchaseOrderId: formData.purchaseOrderId
    };

    onSave(newInvoice);
    onClose();
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setUnitPrice(product.costPrice);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-2026-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <select
                id="supplier"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                disabled={isLinkedToPurchaseOrder}
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {isLinkedToPurchaseOrder && (
                <p className="text-xs text-gray-500 mt-1">
                  This invoice was auto-generated from a purchase order — its status follows the order's approval (Pending → Paid, or Cancelled) and can't be edited manually.
                </p>
              )}
            </div>
          </div>

          {/* Add Products Section */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Add Products</h3>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label htmlFor="product">Product</Label>
                <select
                  id="product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <Button type="button" onClick={handleAddItem} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Invoice Items Table */}
          {formData.items && formData.items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Quantity</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Unit Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Total</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2">${item.totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Invoice Totals */}
              <div className="bg-gray-50 p-4 border-t">
                <div className="flex justify-end space-y-1">
                  <div className="w-64">
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span className="font-medium">${formData.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Tax (10%):</span>
                      <span className="font-medium">${formData.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">${formData.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
