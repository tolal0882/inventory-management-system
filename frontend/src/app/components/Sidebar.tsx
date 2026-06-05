import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownUp,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Truck,
  Menu,
  X,
  FileText,
  User as UserIcon,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/utils';
import { User } from '../types';
import { ProfileModal } from './ProfileModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: User | null;
  onUpdateProfile?: (user: User) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'stock', label: 'Stock In/Out', icon: ArrowDownUp },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'users', label: 'Users', icon: Users },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  isOpen,
  onToggle,
  currentUser,
  onUpdateProfile
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out",
          "w-64 flex flex-col shadow-xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1E90FF] to-[#1565C0] rounded-lg flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-[#1E90FF] to-[#1565C0] bg-clip-text text-transparent">Inventory Pro</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Section */}
        {currentUser && (
          <div className="p-4 border-b border-gray-200">
            <motion.button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all group relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated background on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"
                initial={{ opacity: 0, x: -100 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Avatar with pulse animation */}
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-[#1E90FF] to-[#1565C0] rounded-full flex items-center justify-center shadow-md ring-2 ring-white relative z-10"
                whileHover={{
                  scale: 1.1,
                  boxShadow: '0 0 20px rgba(30, 144, 255, 0.4)',
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 0.3 }}
              >
                <UserIcon className="w-6 h-6 text-white" />
                {/* Online status indicator */}
                <motion.div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              <div className="flex-1 text-left relative z-10">
                <motion.div
                  className="text-sm font-semibold text-gray-900"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentUser.name}
                </motion.div>
                <div className="text-xs text-gray-500">{currentUser.role}</div>
              </div>

              <motion.div
                className="relative z-10"
                animate={{
                  x: [0, 3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </motion.div>
            </motion.button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.filter(item =>
            item.id !== 'users' ||
            currentUser?.role === 'Admin' ||
            currentUser?.role === 'Warehouse_Manager'
          ).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-[#1E90FF] to-[#1565C0] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:translate-x-1"
                )}
              >
                <Icon className={cn("w-5 h-5 relative z-10", isActive && "drop-shadow-sm")} />
                <span className="relative z-10 font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              onNavigate('settings');
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              currentPage === 'settings'
                ? "bg-gradient-to-r from-[#1E90FF] to-[#1565C0] text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:translate-x-1"
            )}
          >
            <Settings className={cn("w-5 h-5", currentPage === 'settings' && "drop-shadow-sm")} />
            <span className="font-medium">Settings</span>
          </button>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:translate-x-1 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-gray-900">Confirm Logout</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to log out? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsLogoutConfirmOpen(false);
                onLogout();
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </>
  );
};