import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, WORKPLACES, DEPARTMENTS } from '../types';
import { Clock } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User & { password?: string }) => void;
  user: User | null;
  restrictToInventoryStaff?: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  restrictToInventoryStaff = false,
}) => {
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    name: '',
    email: '',
    role: 'Inventory_Staff',
    status: 'Active',
    workplace: '',
    department: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({ ...user, password: '' });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Inventory_Staff',
        status: 'Active',
        workplace: '',
        department: '',
        password: '',
      });
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: User & { password?: string } = {
      id: user?.id || Date.now().toString(),
      name: formData.name || '',
      email: formData.email || '',
      role: restrictToInventoryStaff ? 'Inventory_Staff' : (formData.role || 'Inventory_Staff'),
      status: formData.status || 'Active',
      workplace: formData.workplace || '',
      department: formData.department || '',
      ...(formData.password && { password: formData.password }),
    };
    onSave(userData);
  };

  const title = restrictToInventoryStaff
    ? 'Add Inventory Staff'
    : user
    ? 'Edit User'
    : 'Add New User';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {restrictToInventoryStaff && (
            <div className="flex items-center gap-2 mt-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              This account will be <strong className="mx-1">Pending</strong> until an Admin approves it.
            </div>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!user ? '*' : '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                minLength={6}
                placeholder={user ? 'Leave blank to keep current password' : 'Min 6 characters'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              {restrictToInventoryStaff ? (
                <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600 font-medium">
                  Inventory Staff
                </div>
              ) : (
                <Select
                  value={formData.role}
                  onValueChange={(value: User['role']) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Inventory_Staff">Inventory Staff</SelectItem>
                    <SelectItem value="Warehouse_Manager">Warehouse Manager</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {!restrictToInventoryStaff && (
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: User['status']) => setFormData({ ...formData, status: value })}
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
            )}

            <div className="space-y-2">
              <Label htmlFor="workplace">Workplace *</Label>
              <Select
                value={formData.workplace}
                onValueChange={(value: User['workplace']) => setFormData({ ...formData, workplace: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKPLACES.map((workplace) => (
                    <SelectItem key={workplace} value={workplace}>
                      {workplace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value: User['department']) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {user ? 'Update' : restrictToInventoryStaff ? 'Submit for Approval' : 'Add'} User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
