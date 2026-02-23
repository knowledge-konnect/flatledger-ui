# Audit Tracking Implementation Guide

## Overview
Production-grade audit tracking system for financial entities (Payments, Expenses, Bills) with full traceability, soft-delete support, and automatic audit data injection.

**Status**: ✅ Frontend Implementation Complete  
**Backend**: 🔴 API Endpoints Required (see Backend Requirements section)

---

## Features Implemented

### 1. **Audit Fields**
All financial entities now include comprehensive audit tracking:

```typescript
interface AuditFields {
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
```

### 2. **Soft Delete**
Records are never permanently deleted by default:
- `deletedAt` field marks when a record was deleted
- `deletedBy` tracks who performed the deletion
- Queries automatically exclude soft-deleted records
- Records can be restored via `restore` endpoints

### 3. **Automatic Audit Injection**
API client interceptor automatically adds audit data to all requests:
- **POST** (create): Injects `createdBy`, `createdByName`, `createdAt`
- **PUT/PATCH** (update): Injects `updatedBy`, `updatedByName`, `updatedAt`
- **DELETE**: Backend should set `deletedBy`, `deletedByName`, `deletedAt`

### 4. **Utility Functions**
Helper functions for working with audit data:

```typescript
// Filter active records
excludeDeleted(records);

// Check deletion status
isDeleted(record);
isActive(record);

// Get formatted audit metadata
getAuditMetadata(record);
getAuditTrailMessage(record);
formatAuditTimestamp(timestamp);

// Sort by recency
sortByMostRecent(records);
```

---

## Type Definitions

### Updated Entity Types

**Payment** ([src/types/index.ts](src/types/index.ts#L35-L50))
```typescript
interface Payment extends AuditFields {
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
  recordedBy?: string;        // Alias for createdBy
  recordedByName?: string;    // Alias for createdByName
  deletedAt?: string | null;  // Soft delete
}
```

**Expense** ([src/types/index.ts](src/types/index.ts#L52-L67))
```typescript
interface Expense extends AuditFields {
  id: string;
  societyId: string;
  category: string;
  vendor: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedByName?: string;
  deletedAt?: string | null;  // Soft delete
}
```

**Bill** ([src/types/index.ts](src/types/index.ts#L23-L33))
```typescript
interface Bill extends AuditFields {
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
  deletedAt?: string | null;  // Soft delete
}
```

---

## API Layer Changes

### Expenses API ([src/api/expensesApi.ts](src/api/expensesApi.ts))

**Updated DTO:**
```typescript
interface ExpenseResponse {
  publicId: string;
  societyId: number;
  dateIncurred: string;
  categoryCode: string;
  vendor: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Audit fields
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
  deletedBy?: number | null;
  deletedByName?: string | null;
  deletedAt?: string | null;
}
```

**Modified Functions:**
- `listExpenses(includeDeleted = false)` - Now filters soft-deleted
- `getExpensesByDateRange(startDate, endDate, includeDeleted = false)`
- `getExpensesByCategory(categoryCode, includeDeleted = false)`
- `deleteExpense(publicId, hardDelete = false)` - Soft delete by default
- `restoreExpense(publicId)` - NEW: Restore soft-deleted expense

### Payments API ([src/api/maintenanceApi.ts](src/api/maintenanceApi.ts))

**Updated DTO:**
```typescript
interface MaintenancePaymentDto {
  publicId: string;
  societyId: number;
  flatId: number;
  flatNumber: string;
  amount: number;
  paymentDate: string;
  paymentModeId: number;
  paymentModeName: string;
  referenceNumber: string | null;
  notes: string | null;
  
  // Audit fields
  recordedBy: number;         // createdBy
  recordedByName: string;     // createdByName
  createdAt: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
  deletedBy?: number | null;
  deletedByName?: string | null;
  deletedAt?: string | null;
}
```

**Modified Functions:**
- `listBySociety(includeDeleted = false)` - Now filters soft-deleted
- `getByFlat(flatId, includeDeleted = false)`
- `deletePayment(publicId, hardDelete = false)` - Soft delete by default
- `restorePayment(publicId)` - NEW: Restore soft-deleted payment

---

## React Hooks Updates

### useExpenses ([src/hooks/useExpenses.ts](src/hooks/useExpenses.ts))
- ✅ Auto-logs all create/update/delete/approve/reject actions
- ✅ NEW: `useRestoreExpense()` hook for restoration

### useBilling ([src/hooks/useBilling.ts](src/hooks/useBilling.ts))
- ✅ Auto-logs all create/update/delete actions
- ✅ NEW: `useRestorePayment()` hook for restoration

---

## Backend Requirements

### Required API Endpoints

#### 1. **Soft Delete Support**

**For Expenses:**
```http
DELETE /api/expenses/{publicId}?hardDelete=false
POST   /api/expenses/{publicId}/restore
```

**For Payments:**
```http
DELETE /api/maintenance-payments/{publicId}?hardDelete=false
POST   /api/maintenance-payments/{publicId}/restore
```

#### 2. **Query Parameters**

All list endpoints should support `includeDeleted` parameter:
```http
GET /api/expenses?includeDeleted=false
GET /api/expenses/range?startDate=2026-01-01&endDate=2026-01-31&includeDeleted=false
GET /api/expenses/category/{code}?includeDeleted=false
GET /api/maintenance-payments?includeDeleted=false
GET /api/maintenance-payments/flat/{flatId}?includeDeleted=false
```

### Database Schema Changes

**Add to Expenses table:**
```sql
ALTER TABLE Expenses ADD COLUMN updatedBy INT NULL;
ALTER TABLE Expenses ADD COLUMN updatedByName VARCHAR(255) NULL;
ALTER TABLE Expenses ADD COLUMN updatedAt DATETIME NULL;
ALTER TABLE Expenses ADD COLUMN deletedBy INT NULL;
ALTER TABLE Expenses ADD COLUMN deletedByName VARCHAR(255) NULL;
ALTER TABLE Expenses ADD COLUMN deletedAt DATETIME NULL;

-- Index for soft delete queries
CREATE INDEX idx_expenses_deletedAt ON Expenses(deletedAt);
```

**Add to MaintenancePayments table:**
```sql
ALTER TABLE MaintenancePayments ADD COLUMN updatedBy INT NULL;
ALTER TABLE MaintenancePayments ADD COLUMN updatedByName VARCHAR(255) NULL;
ALTER TABLE MaintenancePayments ADD COLUMN updatedAt DATETIME NULL;
ALTER TABLE MaintenancePayments ADD COLUMN deletedBy INT NULL;
ALTER TABLE MaintenancePayments ADD COLUMN deletedByName VARCHAR(255) NULL;
ALTER TABLE MaintenancePayments ADD COLUMN deletedAt DATETIME NULL;

-- Index for soft delete queries
CREATE INDEX idx_maintenance_payments_deletedAt ON MaintenancePayments(deletedAt);
```

**Add to Bills table:**
```sql
ALTER TABLE Bills ADD COLUMN createdBy INT NULL;
ALTER TABLE Bills ADD COLUMN createdByName VARCHAR(255) NULL;
ALTER TABLE Bills ADD COLUMN createdAt DATETIME NULL;
ALTER TABLE Bills ADD COLUMN updatedBy INT NULL;
ALTER TABLE Bills ADD COLUMN updatedByName VARCHAR(255) NULL;
ALTER TABLE Bills ADD COLUMN updatedAt DATETIME NULL;
ALTER TABLE Bills ADD COLUMN deletedBy INT NULL;
ALTER TABLE Bills ADD COLUMN deletedByName VARCHAR(255) NULL;
ALTER TABLE Bills ADD COLUMN deletedAt DATETIME NULL;

-- Index for soft delete queries
CREATE INDEX idx_bills_deletedAt ON Bills(deletedAt);
```

### Backend Implementation Guidelines

#### 1. **Default Query Filtering**
```csharp
// Example: Entity Framework Core
public async Task<List<Expense>> GetExpenses(bool includeDeleted = false)
{
    var query = _context.Expenses.AsQueryable();
    
    if (!includeDeleted)
    {
        query = query.Where(e => e.DeletedAt == null);
    }
    
    return await query.ToListAsync();
}
```

#### 2. **Soft Delete Implementation**
```csharp
public async Task<bool> DeleteExpense(string publicId, bool hardDelete = false)
{
    var expense = await _context.Expenses
        .FirstOrDefaultAsync(e => e.PublicId == publicId);
    
    if (expense == null) return false;
    
    if (hardDelete)
    {
        _context.Expenses.Remove(expense);
    }
    else
    {
        // Get current user from JWT token
        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();
        
        expense.DeletedAt = DateTime.UtcNow;
        expense.DeletedBy = userId;
        expense.DeletedByName = userName;
    }
    
    await _context.SaveChangesAsync();
    return true;
}
```

#### 3. **Restore Implementation**
```csharp
public async Task<Expense> RestoreExpense(string publicId)
{
    var expense = await _context.Expenses
        .FirstOrDefaultAsync(e => e.PublicId == publicId);
    
    if (expense == null)
        throw new NotFoundException("Expense not found");
    
    if (expense.DeletedAt == null)
        throw new BadRequestException("Expense is not deleted");
    
    expense.DeletedAt = null;
    expense.DeletedBy = null;
    expense.DeletedByName = null;
    
    // Set updatedBy fields
    expense.UpdatedBy = GetCurrentUserId();
    expense.UpdatedByName = GetCurrentUserName();
    expense.UpdatedAt = DateTime.UtcNow;
    
    await _context.SaveChangesAsync();
    return expense;
}
```

#### 4. **Update Operations**
```csharp
public async Task<Expense> UpdateExpense(string publicId, UpdateExpenseDto dto)
{
    var expense = await _context.Expenses
        .FirstOrDefaultAsync(e => e.PublicId == publicId && e.DeletedAt == null);
    
    if (expense == null)
        throw new NotFoundException("Expense not found");
    
    // Update fields
    expense.Vendor = dto.Vendor;
    expense.Amount = dto.Amount;
    // ... other fields
    
    // Auto-set updatedBy fields (if not using interceptor)
    expense.UpdatedBy = GetCurrentUserId();
    expense.UpdatedByName = GetCurrentUserName();
    expense.UpdatedAt = DateTime.UtcNow;
    
    await _context.SaveChangesAsync();
    return expense;
}
```

#### 5. **Create Operations**
```csharp
public async Task<Expense> CreateExpense(CreateExpenseDto dto)
{
    var expense = new Expense
    {
        PublicId = Guid.NewGuid().ToString(),
        Vendor = dto.Vendor,
        Amount = dto.Amount,
        // ... other fields
        
        // Auto-set createdBy fields (if not using interceptor)
        CreatedBy = GetCurrentUserId(),
        CreatedByName = GetCurrentUserName(),
        CreatedAt = DateTime.UtcNow
    };
    
    _context.Expenses.Add(expense);
    await _context.SaveChangesAsync();
    return expense;
}
```

#### 6. **Global Query Filter (Recommended)**
```csharp
// In DbContext OnModelCreating
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Global filter to exclude soft-deleted records
    modelBuilder.Entity<Expense>()
        .HasQueryFilter(e => e.DeletedAt == null);
        
    modelBuilder.Entity<MaintenancePayment>()
        .HasQueryFilter(p => p.DeletedAt == null);
        
    modelBuilder.Entity<Bill>()
        .HasQueryFilter(b => b.DeletedAt == null);
}

// To include deleted records when needed
var expenses = await _context.Expenses
    .IgnoreQueryFilters()
    .ToListAsync();
```

---

## Frontend Usage Examples

### Display Audit Trail
```typescript
import { getAuditTrailMessage, formatAuditTimestamp } from '@/api/auditUtils';

function ExpenseCard({ expense }: { expense: ExpenseResponse }) {
  return (
    <div>
      <h3>{expense.description}</h3>
      <p className="text-sm text-gray-500">
        {getAuditTrailMessage(expense)}
      </p>
    </div>
  );
}
```

### Filter Active Records
```typescript
import { excludeDeleted } from '@/api/auditUtils';

function ExpensesList() {
  const { data: allExpenses } = useExpenses();
  const activeExpenses = excludeDeleted(allExpenses || []);
  
  return <>{/* render active expenses */}</>;
}
```

### Restore Deleted Record
```typescript
import { useRestoreExpense } from '@/hooks/useExpenses';

function DeletedExpensesList() {
  const restoreExpense = useRestoreExpense();
  
  const handleRestore = (expenseId: string) => {
    restoreExpense.mutate(expenseId, {
      onSuccess: () => {
        toast.success('Expense restored successfully');
      }
    });
  };
  
  return <>{/* render with restore button */}</>;
}
```

---

## Testing Checklist

### Frontend
- ✅ Type definitions updated
- ✅ API layer handles audit fields
- ✅ Soft delete filtering works
- ✅ Restore functions implemented
- ✅ Hooks auto-log actions
- ✅ Utility functions available
- ✅ No compilation errors

### Backend (Required)
- ⬜ Database schema updated
- ⬜ Soft delete queries exclude deleted records
- ⬜ Hard delete option available
- ⬜ Restore endpoints implemented
- ⬜ Audit fields populated on create
- ⬜ Audit fields populated on update
- ⬜ Audit fields populated on delete
- ⬜ Query filters respect includeDeleted parameter
- ⬜ API returns audit fields in responses

---

## Migration Strategy

### Phase 1: Database Setup
1. Add audit columns to tables
2. Set existing records' `createdAt` to current timestamp
3. Create indexes on `deletedAt` columns

### Phase 2: Backend Implementation
1. Implement soft delete logic in all delete operations
2. Add restore endpoints
3. Update query methods to filter soft-deleted records
4. Add `includeDeleted` parameter support

### Phase 3: Testing
1. Test create operations populate audit fields
2. Test update operations populate `updatedBy`/`updatedAt`
3. Test soft delete sets `deletedAt`/`deletedBy`
4. Test restore functionality
5. Test hard delete option
6. Test query filtering

### Phase 4: Deployment
1. Deploy database migrations
2. Deploy backend API
3. Frontend already deployed ✅
4. Monitor logs for any issues

---

## Backward Compatibility

All changes maintain backward compatibility:

- ✅ Existing API calls work without modification
- ✅ Audit fields are optional in responses
- ✅ Old frontend versions won't break
- ✅ Default behavior excludes soft-deleted records
- ✅ Hard delete still available if needed

---

## Support & Documentation

**Frontend Files:**
- Types: [src/types/index.ts](src/types/index.ts)
- Audit Utils: [src/api/auditUtils.ts](src/api/auditUtils.ts)
- API Client: [src/api/client.ts](src/api/client.ts)
- Expenses API: [src/api/expensesApi.ts](src/api/expensesApi.ts)
- Payments API: [src/api/maintenanceApi.ts](src/api/maintenanceApi.ts)
- Hooks: [src/hooks/useExpenses.ts](src/hooks/useExpenses.ts), [src/hooks/useBilling.ts](src/hooks/useBilling.ts)

**Related Systems:**
- Activity Logs: [src/api/activityLogsApi.ts](src/api/activityLogsApi.ts)
- Activity Hooks: [src/hooks/useActivityLogs.ts](src/hooks/useActivityLogs.ts)

---

**Last Updated:** February 13, 2026  
**Implementation Status:** Frontend Complete | Backend Required
