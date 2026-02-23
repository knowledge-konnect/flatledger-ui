/* =====================================================
   AUDIT TRACKING
===================================================== */

export interface AuditFields {
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletedAt?: string | null;
}

export interface SoftDeleteFields {
  deletedAt?: string | null;
  deletedBy?: string;
  deletedByName?: string;
}

/* =====================================================
   ENTITY TYPES
===================================================== */

export interface Society {
  id: string;
  name: string;
  address: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  totalFlats: number;
  createdAt: string;
}

export interface Flat {
  id: string;
  societyId: string;
  flatNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  maintenanceAmount: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
}

export interface Bill extends AuditFields {
  id: string;
  flatId: string;
  societyId: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount: number;
  paidDate?: string;
  // Audit fields from AuditFields interface
  deletedAt?: string | null;
}

export interface Payment extends AuditFields {
  id: string;
  billId: string;
  flatId: string;
  societyId: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'cash' | 'cheque' | 'upi' | 'bank_transfer' | 'online';
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  recordedBy?: string;
  recordedByName?: string;
  // Audit fields from AuditFields interface
  deletedAt?: string | null;
}

export interface Expense extends AuditFields {
  id: string;
  societyId: string;
  category: 'electricity' | 'water' | 'security' | 'repairs' | 'salary' | 'others';
  vendor: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedByName?: string;
  // Audit fields from AuditFields interface
  deletedAt?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'treasurer' | 'member';
  societyId: string;
  status: 'active' | 'inactive';
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'generated';
  entityType: 'payment' | 'expense' | 'bill' | 'flat' | 'user';
  entityId: string;
  entityName?: string;
  details?: string;
  amount?: number;
  timestamp: string;
  societyId?: string;
}

export interface DashboardStats {
  totalFlats: number;
  totalDue: number;
  totalCollected: number;
  totalExpenses: number;
  currentBalance: number;
  collectionRate: number;
}

export interface ChartData {
  month: string;
  income: number;
  expense: number;
}

export interface Activity {
  id: string;
  type: 'payment' | 'bill' | 'expense';
  description: string;
  amount: number;
  timestamp: string;
}
