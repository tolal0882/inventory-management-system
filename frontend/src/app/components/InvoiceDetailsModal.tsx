import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Invoice } from '../types';
import { FileText, Edit } from 'lucide-react';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit?: (invoice: Invoice) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  invoice,
  onEdit
}) => {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':      return 'bg-green-100 text-green-800';
      case 'Pending':   return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default:          return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[600px] h-[750px] max-w-[600px] max-h-[750px] overflow-hidden flex flex-col p-0">

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-200 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Invoice Details
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body — NO scroll, fixed layout */}
        <div className="flex flex-col flex-1 px-6 py-4 gap-3 overflow-hidden">

          {/* Row 1: Invoice Info + Supplier Info side by side */}
          <div className="grid grid-cols-2 gap-3 shrink-0">

            {/* Invoice Information */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 pb-2 border-b border-gray-200 text-sm">
                <FileText className="w-3.5 h-3.5 text-[#1E90FF]" />
                Invoice Information
              </h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <Label className="text-gray-500 text-xs">Invoice Number</Label>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Status</Label>
                  <div className="mt-0.5">
                    <Badge className={`${getStatusColor(invoice.status)} text-xs px-1.5 py-0.5`}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Invoice Date</Label>
                  <p className="text-gray-900 text-sm mt-0.5">{invoice.invoiceDate}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Due Date</Label>
                  <p className="text-gray-900 text-sm mt-0.5">{invoice.dueDate}</p>
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200 text-sm">
                Supplier Information
              </h3>
              <div className="flex flex-col gap-2">
                <div>
                  <Label className="text-gray-500 text-xs">Supplier Name</Label>
                  <p className="text-gray-900 text-sm mt-0.5">{invoice.supplierName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Created By</Label>
                  <p className="text-gray-900 text-sm mt-0.5">{invoice.createdBy}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Created At</Label>
                  <p className="text-gray-900 text-sm mt-0.5">{invoice.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Invoice Items table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <div className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] px-4 py-2">
              <h3 className="font-semibold text-white text-sm">Invoice Items</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-gray-900 text-sm">{item.productName}</td>
                    <td className="px-4 py-2 text-right text-gray-900 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-gray-900 text-sm">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 text-sm">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Row 3: Totals + Notes side by side */}
          <div className="grid grid-cols-2 gap-3 shrink-0">

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Subtotal:</span>
                <span className="text-gray-900 text-sm">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Tax (10%):</span>
                <span className="text-gray-900 text-sm">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900 text-sm">Total Amount:</span>
                <span className="font-bold text-[#1E90FF]">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes ? (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Notes</h3>
                <p className="text-gray-700 text-sm leading-snug">{invoice.notes}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                <p className="text-gray-400 text-sm italic">No notes added.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer — Action Buttons */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              className="bg-gradient-to-r from-[#1E90FF] to-[#1565C0] hover:opacity-90"
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Invoice
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
