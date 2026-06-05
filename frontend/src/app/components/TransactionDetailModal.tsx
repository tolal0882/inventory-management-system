import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { StockTransaction, User } from '../types';
import { Package, Calendar, User as UserIcon, MapPin, FileText, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, XCircle, Pencil } from 'lucide-react';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: StockTransaction | null;
  currentUser?: User | null;
  onEdit?: (transaction: StockTransaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currentUser,
  onEdit,
}) => {
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Transaction Type Banner */}
          {(() => {
            const bannerConfig = {
              IN:        { bg: 'bg-green-50 border-green-200',  icon: <TrendingUp className="w-8 h-8 text-green-600" />,    label: 'Stock IN' },
              OUT:       { bg: 'bg-orange-50 border-orange-200', icon: <TrendingDown className="w-8 h-8 text-orange-600" />, label: 'Stock OUT' },
              TRANSFER:  { bg: 'bg-blue-50 border-blue-200',    icon: <ArrowRightLeft className="w-8 h-8 text-blue-600" />, label: 'Transfer' },
              SHRINKAGE: { bg: 'bg-amber-50 border-amber-200',  icon: <AlertTriangle className="w-8 h-8 text-amber-600" />, label: 'Shrinkage' },
            }[transaction.type] ?? { bg: 'bg-gray-50 border-gray-200', icon: null, label: transaction.type };
            return (
              <div className={`p-4 rounded-lg border ${bannerConfig.bg}`}>
                <div className="flex items-center gap-3">
                  {bannerConfig.icon}
                  <div>
                    <h3 className="font-semibold text-lg">{bannerConfig.label}</h3>
                    <p className="text-sm text-gray-600">Transaction ID: {transaction.id}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Package className="w-4 h-4" />
                <span>Product</span>
              </div>
              <p className="font-semibold text-lg">{transaction.productName}</p>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Package className="w-4 h-4" />
                <span>Quantity</span>
              </div>
              <p className="font-semibold text-lg">{transaction.quantity} units</p>
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>Warehouse</span>
              </div>
              <p className="font-medium">{transaction.warehouse}</p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Date & Time</span>
              </div>
              <p className="font-medium">{transaction.date}</p>
            </div>

            {/* User */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <UserIcon className="w-4 h-4" />
                <span>Processed By</span>
              </div>
              <p className="font-medium">{transaction.userName || transaction.user || '—'}</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Status</span>
              </div>
              <Badge
                variant={
                  transaction.status === 'Approved'
                    ? 'default'
                    : transaction.status === 'Rejected'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-sm"
              >
                {transaction.status}
              </Badge>
            </div>
          </div>

          {/* Note / Rejection Reason Section */}
          {transaction.note && (
            transaction.status === 'Rejected' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                  <XCircle className="w-4 h-4" />
                  <span>Rejection Reason</span>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800">{transaction.note}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Note</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700">{transaction.note}</p>
                </div>
              </div>
            )
          )}

          {/* Transaction Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Transaction Summary</h4>
            <div className="text-sm text-blue-800">
              {transaction.type === 'IN' && (
                <p><span className="font-medium">{transaction.quantity}</span> units of <span className="font-medium">{transaction.productName}</span> were added to <span className="font-medium">{transaction.warehouse}</span> warehouse.</p>
              )}
              {transaction.type === 'OUT' && (
                <p><span className="font-medium">{transaction.quantity}</span> units of <span className="font-medium">{transaction.productName}</span> were removed from <span className="font-medium">{transaction.warehouse}</span> warehouse.</p>
              )}
              {transaction.type === 'TRANSFER' && (
                <p><span className="font-medium">{transaction.quantity}</span> units of <span className="font-medium">{transaction.productName}</span> transferred from <span className="font-medium">{transaction.fromWarehouse}</span> to <span className="font-medium">{transaction.toWarehouse}</span>.</p>
              )}
              {transaction.type === 'SHRINKAGE' && (
                <p><span className="font-medium">{transaction.quantity}</span> units of <span className="font-medium">{transaction.productName}</span> recorded as shrinkage at <span className="font-medium">{transaction.warehouse}</span> warehouse.</p>
              )}
            </div>
          </div>
        </div>

        {currentUser?.role === 'Admin' && onEdit && (
          <DialogFooter className="pt-2">
            <Button
              onClick={() => { onClose(); onEdit(transaction); }}
              className="bg-[#1E90FF] hover:bg-[#1873CC]"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Transaction
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
