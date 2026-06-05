// Mock @prisma/client enums for tests — no DB connection needed
export const UserRole = {
  Admin: 'Admin',
  Inventory_Staff: 'Inventory_Staff',
  Warehouse_Manager: 'Warehouse_Manager',
  Auditor: 'Auditor',
} as const;

export const UserStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Pending: 'Pending',
  PendingDeletion: 'PendingDeletion',
} as const;

export const TransactionType = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER: 'TRANSFER',
  SHRINKAGE: 'SHRINKAGE',
} as const;

export const PrismaClient = jest.fn();
