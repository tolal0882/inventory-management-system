import {
  Product,
  Supplier,
  StockTransaction,
  User,
  AuditLog,
  UserActivityLog,
  Invoice,
} from "../types";

// Default admin user for demo login
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Administrator",
    email: "tolalong7@gmail.com",
    role: "Admin",
    status: "Active",
    workplace: "Headquarters",
    department: "Administration",
  },
];

// Empty datasets - ready for users to populate with their inventory data
export const mockProducts: Product[] = [];

export const mockSuppliers: Supplier[] = [];

export const mockTransactions: StockTransaction[] = [];

export const mockAuditLogs: AuditLog[] = [];

export const mockUserActivityLogs: UserActivityLog[] = [];

export const mockInvoices: Invoice[] = [];