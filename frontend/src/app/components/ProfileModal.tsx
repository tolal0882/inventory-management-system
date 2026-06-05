import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';
import { toast } from 'sonner';
import { usersApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onUpdateProfile?: (user: UserType) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: '+855',
    workplace: currentUser.workplace || 'Not specified',
    department: currentUser.department || 'Not specified',
  });

  useEffect(() => {
    const savedPhone = localStorage.getItem(`phone_${currentUser.id}`) || '+855';
    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      phone: savedPhone,
      workplace: currentUser.workplace || 'Not specified',
      department: currentUser.department || 'Not specified',
    });
  }, [currentUser, isOpen]);


  const handleSave = async () => {
    try {
      localStorage.setItem(`phone_${currentUser.id}`, formData.phone);
      await usersApi.update(currentUser.id, {
        name: formData.name,
        email: formData.email,
        workplace: formData.workplace,
        department: formData.department,
      });
      if (onUpdateProfile) {
        onUpdateProfile({
          ...currentUser,
          name: formData.name,
          email: formData.email,
          workplace: formData.workplace,
          department: formData.department,
        });
      }
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save profile');
    }
  };

  const smoothSpring = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.8
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.9, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, x: 30, scale: 0.9, filter: "blur(4px)" }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
    exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const joinDate = new Date(2023, 0, 15).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const { transactions } = useApp();
  const totalTransactions = transactions.length;
  const approvals = transactions.filter(t => t.status === 'Approved').length;
  const stockIn = transactions.filter(t => t.type === 'IN').length;
  const stockOut = transactions.filter(t => t.type === 'OUT').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={smoothSpring}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.6, delay: 0.2 }}>
                <User className="w-5 h-5 text-blue-600" />
              </motion.div>
              <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smoothSpring, delay: 0.1 }}>
                User Profile
              </motion.span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile Header */}
            <motion.div
              className="flex items-center gap-4 pb-6 border-b"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center relative"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                transition={{ duration: 0.3 }}
              >
                <User className="w-10 h-10 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="flex-1">
                <motion.h3 className="text-xl font-semibold text-gray-900" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  {currentUser.name}
                </motion.h3>
                <motion.div className="flex items-center gap-2 mt-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{currentUser.role?.replace(/_/g, ' ')}</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 mt-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <motion.span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentUser.status}
                  </motion.span>
                </motion.div>
              </div>
              <motion.div whileHover={{ scale: 1.06, rotate: isEditing ? -1 : 1, y: -2 }} whileTap={{ scale: 0.94, y: 0 }} transition={smoothSpring}>
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'outline' : 'default'} className="relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isEditing ? 'cancel' : 'edit'}
                      initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                      transition={smoothSpring}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </motion.span>
                  </AnimatePresence>
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6, ease: "easeInOut" }} />
                </Button>
              </motion.div>
            </motion.div>

            {/* Profile Details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isEditing ? 'edit-mode' : 'view-mode'}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                {/* Name */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label htmlFor="name">Full Name</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.div key="name-edit" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} layout>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="transition-all duration-200" />
                      </motion.div>
                    ) : (
                      <motion.div key="name-view" className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} layout>
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{formData.name}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Email */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label htmlFor="email">Email Address</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.div key="email-edit" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} layout>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="transition-all duration-200" />
                      </motion.div>
                    ) : (
                      <motion.div key="email-view" className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} layout>
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{formData.email}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Phone with +855 */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label htmlFor="phone">Phone Number</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.div key="phone-edit" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} layout>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+855 XX XXX XXXX"
                          className="transition-all duration-200"
                        />
                      </motion.div>
                    ) : (
                      <motion.div key="phone-view" className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} layout>
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{formData.phone === '+855' ? 'Not specified' : formData.phone}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Department */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label htmlFor="department">Department</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.div key="dept-edit" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} layout>
                        <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="transition-all duration-200" />
                      </motion.div>
                    ) : (
                      <motion.div key="dept-view" className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} layout>
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span>{formData.department}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Workplace */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label htmlFor="workplace">Workplace</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.div key="work-edit" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} layout>
                        <Input id="workplace" value={formData.workplace} onChange={(e) => setFormData({ ...formData, workplace: e.target.value })} className="transition-all duration-200" />
                      </motion.div>
                    ) : (
                      <motion.div key="work-view" className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={smoothSpring} whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} layout>
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{formData.workplace}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Join Date */}
                <motion.div className="space-y-2" variants={fieldVariants} layout="position">
                  <Label>Join Date</Label>
                  <motion.div className="flex items-center gap-2 text-gray-700 p-2.5 rounded-lg cursor-pointer" whileHover={{ x: 6, backgroundColor: 'rgba(243, 244, 246, 1)', scale: 1.01 }} transition={smoothSpring} layout>
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{joinDate}</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Activity Stats */}
            <motion.div className="border-t pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Activity Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Transactions', value: totalTransactions, bg: 'bg-blue-50', gradient: 'from-blue-100 to-blue-200', delay: 0 },
                  { label: 'Approvals', value: approvals, bg: 'bg-green-50', gradient: 'from-green-100 to-green-200', delay: 0.1 },
                  { label: 'Stock In', value: stockIn, bg: 'bg-orange-50', gradient: 'from-orange-100 to-orange-200', delay: 0.2 },
                  { label: 'Stock Out', value: stockOut, bg: 'bg-purple-50', gradient: 'from-purple-100 to-purple-200', delay: 0.3 }
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className={`${stat.bg} p-4 rounded-lg cursor-pointer relative overflow-hidden`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + stat.delay }}
                    whileHover={{ scale: 1.05, y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0`} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }} />
                    <p className="text-2xl font-bold text-gray-900 relative z-10">{stat.value}</p>
                    <p className="text-xs text-gray-600 relative z-10 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <AnimatePresence mode="wait">
              {isEditing && (
                <motion.div
                  className="flex justify-end gap-3 pt-4 border-t overflow-hidden"
                  initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 16, transition: { ...smoothSpring, height: { duration: 0.4 }, opacity: { duration: 0.3 } } }}
                  exit={{ opacity: 0, y: -20, height: 0, marginTop: 0, transition: { ...smoothSpring, height: { duration: 0.3 } } }}
                  layout
                >
                  <motion.div initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ ...smoothSpring, delay: 0.1 }} whileHover={{ scale: 1.06, x: -3, y: -2 }} whileTap={{ scale: 0.94, y: 0 }}>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="relative overflow-hidden">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.5 }} />
                      <span className="relative z-10">Cancel</span>
                    </Button>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ ...smoothSpring, delay: 0.15 }} whileHover={{ scale: 1.06, x: 3, y: -2, boxShadow: '0 12px 24px rgba(59, 130, 246, 0.35)' }} whileTap={{ scale: 0.94, y: 0 }}>
                    <Button onClick={handleSave} className="relative overflow-hidden group">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6, ease: "easeInOut" }} />
                      <motion.span className="relative z-10" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                        Save Changes
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};