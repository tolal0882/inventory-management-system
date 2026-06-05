import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Clock, CheckCircle, UserPlus, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { User, UserActivityLog } from '../types';
import { UserModal } from '../components/UserModal';
import { UserActivityModal } from '../components/UserActivityModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { usersApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface UsersPageProps {
  users: User[];
  currentUser: User | null;
  onUsersChange: (users: User[]) => void;
  activityLogs: UserActivityLog[];
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, currentUser, onUsersChange, activityLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';
  const isWarehouseManager = currentUser?.role === 'Warehouse_Manager';
  const { updateCurrentUser } = useApp();

  const visibleUsers = isWarehouseManager
    ? users.filter(u => u.role === 'Inventory_Staff')
    : users;

  const filteredUsers = visibleUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.workplace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingApprovalCount = isAdmin ? users.filter(u => u.status === 'Pending').length : 0;
  const pendingDeletionCount = isAdmin ? users.filter(u => u.status === 'PendingDeletion').length : 0;

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleRequestDelete = async (user: User) => {
    setIsLoading(true);
    try {
      await usersApi.requestDelete(user.id);
      const updated = await usersApi.getAll();
      onUsersChange(updated);
      toast.success(`Deletion request for "${user.name}" sent to Admin for approval`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to request deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsLoading(true);
    try {
      await usersApi.delete(deletingUser.id);
      const updated = await usersApi.getAll();
      onUsersChange(updated);
      toast.success(`User "${deletingUser.name}" deleted`);
      setDeletingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (user: User) => {
    setIsLoading(true);
    try {
      await usersApi.approve(user.id);
      const updated = await usersApi.getAll();
      onUsersChange(updated);
      toast.success(`"${user.name}" approved — account is now Active`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = async (user: User) => {
    setIsLoading(true);
    try {
      await usersApi.cancelDelete(user.id);
      const updated = await usersApi.getAll();
      onUsersChange(updated);
      toast.success(`Deletion request for "${user.name}" cancelled — account restored`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (user: User & { password?: string }) => {
    setIsLoading(true);
    try {
      if (editingUser) {
        const { id, createdAt, updatedAt, password, status, role, ...rest } = user as any;
        const updateData: any = { ...rest, role, status };
        if (password) updateData.password = password;
        await usersApi.update(user.id, updateData);
        if (editingUser.id === currentUser?.id) {
          updateCurrentUser({ ...currentUser, name: updateData.name, email: updateData.email, role: updateData.role, workplace: updateData.workplace, department: updateData.department, status: updateData.status } as User);
        }
        toast.success(`User "${user.name}" updated successfully`);
      } else {
        const { id, createdAt, updatedAt, status, role, ...rest } = user as any;
        await usersApi.create({ ...rest, role });
        toast.success(
          isWarehouseManager
            ? `"${user.name}" submitted — waiting for Admin approval`
            : `User "${user.name}" added successfully`
        );
      }
      const updated = await usersApi.getAll();
      onUsersChange(updated);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewActivity = (user: User) => {
    setSelectedUser(user);
    setActivityModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (!isAdmin && !isWarehouseManager) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>You don't have permission to access this page.</AlertDescription>
          </Alert>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex items-center justify-between flex-wrap gap-3" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isAdmin ? 'Users Management' : 'Inventory Staff'}
          </h1>
          {isWarehouseManager && (
            <p className="text-sm text-gray-500 mt-0.5">
              You can add or remove Inventory Staff — all changes require Admin approval.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && pendingApprovalCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-3 py-1">
              <Clock className="w-3 h-3" />
              {pendingApprovalCount} pending approval
            </span>
          )}
          {isAdmin && pendingDeletionCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-full px-3 py-1">
              <Trash2 className="w-3 h-3" />
              {pendingDeletionCount} pending deletion
            </span>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddUser} className="bg-[#1E90FF] hover:bg-[#1873CC]">
              {isWarehouseManager
                ? <><UserPlus className="w-4 h-4 mr-2" /> Add Inventory Staff</>
                : <><Plus className="w-4 h-4 mr-2" /> Add User</>
              }
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div className="bg-white rounded-lg border border-gray-200 p-4" variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={isWarehouseManager ? 'Search Inventory Staff by name, email, or workplace...' : 'Search users by name, email, role, workplace, or department...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div className="bg-white rounded-lg border border-gray-200 overflow-hidden" variants={itemVariants} whileHover={{ scale: 1.005 }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {isAdmin && <TableHead>Role</TableHead>}
                <TableHead>Workplace</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-gray-500 py-8">
                    {isWarehouseManager ? 'No Inventory Staff found' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => {
                  const isPending = user.status === 'Pending';
                  const isPendingDeletion = user.status === 'PendingDeletion';
                  const isActive = user.status === 'Active';

                  const rowClass = isPendingDeletion
                    ? 'bg-red-50 hover:bg-red-100'
                    : isPending
                    ? 'bg-amber-50 hover:bg-amber-100'
                    : 'hover:bg-gray-50';

                  return (
                    <motion.tr
                      key={user.id}
                      className={`${rowClass} ${isAdmin && isActive ? 'cursor-pointer' : 'cursor-default'}`}
                      onClick={() => isAdmin && isActive && handleEditUser(user)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      component={TableRow as any}
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Warehouse_Manager' ? 'secondary' : 'outline'}>
                            {user.role?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell><span className="text-sm text-gray-600">{user.workplace || '-'}</span></TableCell>
                      <TableCell><span className="text-sm text-gray-600">{user.department || '-'}</span></TableCell>
                      <TableCell>
                        {isPending && (
                          <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100">
                            ⏳ Pending Approval
                          </Badge>
                        )}
                        {isPendingDeletion && (
                          <Badge variant="outline" className="border-red-400 text-red-700 bg-red-100">
                            🗑 Pending Deletion
                          </Badge>
                        )}
                        {!isPending && !isPendingDeletion && (
                          <Badge variant={isActive ? 'default' : 'secondary'}>{user.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>

                          {/* ── ADMIN actions ── */}
                          {isAdmin && isPending && (
                            <>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" onClick={() => handleApproveUser(user)} className="text-green-600 hover:bg-green-50" disabled={isLoading} title="Approve account">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" onClick={() => handleConfirmDelete(user)} className="text-red-600 hover:bg-red-50" disabled={isLoading} title="Reject & remove">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </>
                          )}

                          {isAdmin && isPendingDeletion && (
                            <>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" onClick={() => handleConfirmDelete(user)} className="text-red-600 hover:bg-red-50 font-medium" disabled={isLoading} title="Confirm deletion">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" onClick={() => handleCancelDelete(user)} className="text-blue-600 hover:bg-blue-50" disabled={isLoading} title="Cancel deletion request">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </>
                          )}

                          {isAdmin && isActive && (
                            <>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} title="Edit user">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => handleConfirmDelete(user)}
                                  className="text-red-600 hover:bg-red-50"
                                  disabled={user.id === currentUser?.id || isLoading}
                                  title={user.id === currentUser?.id ? "Can't delete yourself" : 'Delete user'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </>
                          )}

                          {/* ── WAREHOUSE MANAGER actions ── */}
                          {isWarehouseManager && isActive && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleRequestDelete(user)}
                                className="text-red-600 hover:bg-red-50"
                                disabled={isLoading}
                                title="Request deletion (requires Admin approval)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}

                          {isWarehouseManager && isPending && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium px-1">
                              <Clock className="w-3 h-3" /> Awaiting approval
                            </span>
                          )}

                          {isWarehouseManager && isPendingDeletion && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium px-1">
                              <Clock className="w-3 h-3" /> Deletion requested
                            </span>
                          )}

                          {/* Timeline — Admin only */}
                          {isAdmin && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" onClick={() => handleViewActivity(user)} title="View activity timeline">
                                <Clock className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        restrictToInventoryStaff={isWarehouseManager && !editingUser}
      />
      {isAdmin && (
        <DeleteConfirmModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={confirmDelete}
          itemName={deletingUser?.name || ''}
          itemType="user"
        />
      )}
      <UserActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        user={selectedUser}
        activityLogs={activityLogs}
      />
    </motion.div>
  );
};
