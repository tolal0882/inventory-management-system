import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, AlertTriangle, CheckCircle, ShoppingCart, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Product, StockTransaction, User, SystemSettings } from '../types';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'low_stock' | 'pending_approval' | 'order_delivered' | 'expiring_soon' | 'shrinkage';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: 'package' | 'alert' | 'check' | 'cart';
  severity: 'info' | 'warning' | 'error' | 'success';
  productId?: string;
  transactionId?: string;
  targetPage?: string;
}

interface NotificationsDropdownProps {
  products: Product[];
  transactions: StockTransaction[];
  onNavigate?: (page: string, itemId?: string) => void;
  currentUser?: User | null;
  systemSettings?: SystemSettings;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  products,
  transactions,
  onNavigate,
  currentUser = null,
  systemSettings,
}) => {
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const seenIdsRef = useRef<Set<string> | null>(null);

  // Preferences default to "on" so notifications behave the same as
  // before for any account that hasn't saved a preference yet.
  const lowStockAlertsEnabled = currentUser?.lowStockAlerts ?? true;
  const orderNotificationsEnabled = currentUser?.orderNotifications ?? true;
  const thresholdPercent = systemSettings?.lowStockThresholdPercent ?? 0;

  const isLowStock = (p: Product) => p.stockQuantity < p.minStock * (1 + thresholdPercent / 100);

  // Reset expanded state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  // Generate notifications based on data
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    // Low stock notifications - ALL of them (unless the user turned this off)
    if (lowStockAlertsEnabled) {
      const lowStockProducts = products.filter(p => isLowStock(p) && p.status === 'Active');
      lowStockProducts.forEach((product, index) => {
        notifications.push({
          id: `low-stock-${product.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is below minimum stock (${product.stockQuantity}/${product.minStock})`,
          time: `${2 + index} min ago`,
          read: readNotifications.has(`low-stock-${product.id}`),
          icon: 'alert',
          severity: 'warning',
          productId: product.id,
          targetPage: 'products',
        });
      });
    }

    // Pending approval notifications (order/stock-in approvals — unless turned off)
    if (orderNotificationsEnabled) {
      const pendingTransactions = transactions.filter(t => t.status === 'Pending');
      if (pendingTransactions.length > 0) {
        notifications.push({
          id: 'pending-approvals',
          type: 'pending_approval',
          title: 'Pending Approvals',
          message: `${pendingTransactions.length} transaction(s) awaiting approval`,
          time: '5 min ago',
          read: readNotifications.has('pending-approvals'),
          icon: 'check',
          severity: 'info',
          targetPage: 'stock',
        });
      }
    }

    // Expiring soon notifications - ALL of them
    const expiringProducts = products.filter(p => {
      if (!p.expirationDate) return false;
      const expirationDate = new Date(p.expirationDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    expiringProducts.forEach((product, index) => {
      const daysUntilExpiry = Math.ceil((new Date(product.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `expiring-${product.id}`,
        type: 'expiring_soon',
        title: 'Expiring Soon',
        message: `${product.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
        time: `${10 + index * 5} min ago`,
        read: readNotifications.has(`expiring-${product.id}`),
        icon: 'alert',
        severity: 'error',
        productId: product.id,
        targetPage: 'products',
      });
    });

    // Shrinkage notifications - ALL of them
    const shrinkageTransactions = transactions.filter(t => t.type === 'SHRINKAGE');
    shrinkageTransactions.forEach((transaction, index) => {
      notifications.push({
        id: `shrinkage-${transaction.id}`,
        type: 'shrinkage',
        title: 'Shrinkage Recorded',
        message: `${transaction.productName}: ${transaction.quantity} units (${transaction.shrinkageReason})`,
        time: `${1 + index} hour ago`,
        read: readNotifications.has(`shrinkage-${transaction.id}`),
        icon: 'alert',
        severity: 'error',
        transactionId: transaction.id,
        targetPage: 'stock',
      });
    });

    return notifications;
  };

  const allNotifications = generateNotifications();
  const displayedNotifications = isExpanded ? allNotifications : allNotifications.slice(0, 5);
  const unreadCount = allNotifications.filter(n => !n.read).length;

  // Real-time browser notifications: whenever a notification appears that
  // wasn't there on the previous render (e.g. the 15s data poll picked up
  // a new low-stock item), fire a native browser notification — but only
  // if the user has Push Notifications on and already granted permission.
  useEffect(() => {
    const currentIds = new Set(allNotifications.map(n => n.id));
    const previousIds = seenIdsRef.current;
    seenIdsRef.current = currentIds;

    // Skip on first run (previousIds === null) — otherwise every
    // pre-existing notification would fire a browser popup on load.
    if (previousIds === null) return;
    if (!currentUser?.pushNotifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    for (const n of allNotifications) {
      if (!previousIds.has(n.id)) {
        new Notification(n.title, { body: n.message });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNotifications.map(n => n.id).join(',')]);

  const handleMarkAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const handleMarkAllAsRead = () => {
    const allIds = allNotifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);

    // Navigate to target page
    if (onNavigate && notification.targetPage) {
      onNavigate(notification.targetPage, notification.productId || notification.transactionId);
      setIsOpen(false);
      setIsExpanded(false);
      toast.info(`Navigating to ${notification.targetPage}`);
    }
  };

  const handleViewAll = () => {
    setIsExpanded(!isExpanded);
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'package':
        return <Package className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'check':
        return <CheckCircle className="w-4 h-4" />;
      case 'cart':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-orange-100 text-orange-600';
      case 'success':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            <Bell className="w-5 h-5 text-gray-600" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`w-80 md:w-96 p-0 ${isExpanded ? 'max-h-[600px]' : 'max-h-[500px]'} overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          </div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Check className="w-3 h-3" />
                Mark all read
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="divide-y">
          {allNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-8 text-center text-gray-500"
            >
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`px-4 py-3 hover:bg-gradient-to-r cursor-pointer transition-all relative group ${
                    !notification.read
                      ? 'bg-blue-50 hover:from-blue-100 hover:to-blue-50'
                      : 'hover:from-gray-50 hover:to-white'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {getIcon(notification.icon)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </p>
                        <AnimatePresence>
                          {!notification.read && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <div className="text-xs text-blue-600 font-medium">View →</div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {allNotifications.length > 0 && allNotifications.length > 5 && (
          <div className="border-t px-4 py-3 text-center bg-gray-50">
            <motion.button
              onClick={handleViewAll}
              className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium w-full hover:bg-blue-50 py-2 rounded transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View all ({allNotifications.length} notifications)
                </>
              )}
            </motion.button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
