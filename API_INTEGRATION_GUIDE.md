# API Integration Best Practices

This document provides examples and best practices for integrating with the SocietyLedger API following the official documentation standards.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Error Handling](#error-handling)
3. [Common Patterns](#common-patterns)
4. [React Hook Examples](#react-hook-examples)
5. [Component Examples](#component-examples)

---

## Authentication Flow

### Login Example

```typescript
import { authApi } from '@/api/authApi';
import { handleApiError } from '@/api/errorHandler';

async function handleLogin(email: string, password: string) {
  try {
    const { auth, user } = await authApi.login({
      usernameOrEmail: email,
      password: password
    });

    // Store tokens and user data
    localStorage.setItem('accessToken', auth.accessToken);
    localStorage.setItem('refreshToken', auth.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    const errorInfo = handleApiError(error, {
      onUnauthorized: () => {
        showToast({ title: 'Login Failed', description: 'Invalid credentials' });
      }
    });
    
    if (errorInfo.type !== 'unauthorized') {
      showToast({ title: 'Error', description: errorInfo.message });
    }
  }
}
```

### Logout Example

```typescript
import { authApi } from '@/api/authApi';

async function handleLogout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
  } catch (error) {
    // Log error but continue with cleanup
    console.error('Logout API call failed:', error);
  } finally {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('societyId');
    localStorage.removeItem('societyPublicId');
    
    // Redirect to login
    window.location.href = '/login';
  }
}
```

---

## Error Handling

### Basic Error Handling

```typescript
import { flatsApi } from '@/api/flatsApi';
import { categorizeApiError, toToastError } from '@/api/errorHandler';

async function createFlat(flatData: CreateFlatDto) {
  try {
    const flat = await flatsApi.createFlat(flatData);
    showToast({ title: 'Success', description: 'Flat created successfully' });
    return flat;
  } catch (error) {
    const errorInfo = categorizeApiError(error);
    const toastError = toToastError(errorInfo);
    showToast({ title: toastError.title, description: toastError.description });
    throw error;
  }
}
```

### Validation Error Handling

```typescript
import { flatsApi } from '@/api/flatsApi';
import { handleApiError, formatValidationErrors } from '@/api/errorHandler';

async function createFlatWithValidation(flatData: CreateFlatDto) {
  // Clear previous errors
  setFieldErrors({});

  try {
    const flat = await flatsApi.createFlat(flatData);
    return flat;
  } catch (error) {
    const errorInfo = handleApiError(error, {
      onValidationError: (errors) => {
        // Set field-level errors for form display
        const formatted = formatValidationErrors(errors);
        setFieldErrors(formatted);
      },
      onConflict: () => {
        showToast({ 
          title: 'Conflict', 
          description: 'Flat number already exists' 
        });
      }
    });

    // Show generic error if not validation
    if (errorInfo.type !== 'validation' && errorInfo.type !== 'conflict') {
      showToast({ 
        title: 'Error', 
        description: errorInfo.message 
      });
    }
    
    throw error;
  }
}
```

---

## Common Patterns

### Fetching Data with Loading State

```typescript
import { useState, useEffect } from 'react';
import { flatsApi } from '@/api/flatsApi';
import { categorizeApiError } from '@/api/errorHandler';

function useFlats() {
  const [flats, setFlats] = useState<FlatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlats() {
      try {
        setLoading(true);
        setError(null);
        const data = await flatsApi.listBySociety();
        setFlats(data);
      } catch (err) {
        const errorInfo = categorizeApiError(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFlats();
  }, []);

  return { flats, loading, error };
}
```

### Creating Resources

```typescript
import { maintenanceApi } from '@/api/maintenanceApi';
import { handleApiError } from '@/api/errorHandler';

async function recordPayment(paymentData: CreateMaintenancePaymentDto) {
  try {
    const payment = await maintenanceApi.createPayment(paymentData);
    
    showToast({ 
      title: 'Success', 
      description: 'Payment recorded successfully' 
    });

    // Refresh payment list or navigate
    router.push('/payments');
    
    return payment;
  } catch (error) {
    const errorInfo = handleApiError(error, {
      onValidationError: (errors) => {
        console.error('Validation errors:', errors);
        // Display field errors in form
      },
      onNotFound: () => {
        showToast({ 
          title: 'Error', 
          description: 'Flat not found' 
        });
      }
    });

    throw error;
  }
}
```

### Updating Resources

```typescript
import { flatsApi } from '@/api/flatsApi';
import { handleApiError } from '@/api/errorHandler';

async function updateFlat(publicId: string, updates: Partial<CreateFlatDto>) {
  try {
    const updatedFlat = await flatsApi.updateFlat({
      publicId,
      flatNo: updates.flatNo!,
      ownerName: updates.ownerName,
      contactMobile: updates.contactMobile,
      contactEmail: updates.contactEmail,
      maintenanceAmount: updates.maintenanceAmount,
      statusCode: updates.statusCode
    });

    showToast({ 
      title: 'Success', 
      description: 'Flat updated successfully' 
    });

    return updatedFlat;
  } catch (error) {
    handleApiError(error, {
      onValidationError: (errors) => {
        setFieldErrors(formatValidationErrors(errors));
      },
      onConflict: () => {
        showToast({ 
          title: 'Conflict', 
          description: 'Flat number already taken' 
        });
      },
      onNotFound: () => {
        showToast({ 
          title: 'Not Found', 
          description: 'Flat no longer exists' 
        });
      }
    });

    throw error;
  }
}
```

### Deleting Resources

```typescript
import { flatsApi } from '@/api/flatsApi';
import { handleApiError } from '@/api/errorHandler';

async function deleteFlat(publicId: string) {
  // Show confirmation dialog first
  const confirmed = await showConfirmDialog({
    title: 'Delete Flat',
    description: 'Are you sure you want to delete this flat? This action cannot be undone.',
  });

  if (!confirmed) return;

  try {
    await flatsApi.deleteFlat(publicId);
    
    showToast({ 
      title: 'Success', 
      description: 'Flat deleted successfully' 
    });

    // Refresh list
    refreshFlats();
  } catch (error) {
    handleApiError(error, {
      onNotFound: () => {
        showToast({ 
          title: 'Not Found', 
          description: 'Flat already deleted or not found' 
        });
      }
    });
  }
}
```

---

## React Hook Examples

### useSubscriptionStatus Hook

```typescript
import { useState, useEffect } from 'react';
import { subscriptionApi, SubscriptionStatusData } from '@/api/subscriptionApi';
import { categorizeApiError } from '@/api/errorHandler';

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true);
        const data = await subscriptionApi.getStatus();
        setStatus(data);
      } catch (err) {
        const errorInfo = categorizeApiError(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await subscriptionApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      const errorInfo = categorizeApiError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    status, 
    loading, 
    error,
    refetch,
    isActive: status?.accessAllowed ?? false,
    isTrial: status?.status === 'trial',
  };
}
```

### usePaymentModes Hook

```typescript
import { useState, useEffect } from 'react';
import { maintenanceApi, PaymentModeDto } from '@/api/maintenanceApi';

export function usePaymentModes() {
  const [modes, setModes] = useState<PaymentModeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModes() {
      try {
        const data = await maintenanceApi.getPaymentModes();
        setModes(data);
      } catch (error) {
        console.error('Failed to fetch payment modes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchModes();
  }, []);

  return { modes, loading };
}
```

---

## Component Examples

### Flat List Component

```typescript
import { useEffect, useState } from 'react';
import { flatsApi, FlatDto } from '@/api/flatsApi';
import { categorizeApiError } from '@/api/errorHandler';

export function FlatList() {
  const [flats, setFlats] = useState<FlatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFlats();
  }, []);

  async function loadFlats() {
    try {
      setLoading(true);
      setError(null);
      const data = await flatsApi.listBySociety();
      setFlats(data);
    } catch (err) {
      const errorInfo = categorizeApiError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Flats</h2>
      <ul>
        {flats.map(flat => (
          <li key={flat.publicId}>
            {flat.flatNo} - {flat.ownerName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Payment Form Component

```typescript
import { useState } from 'react';
import { maintenanceApi, CreateMaintenancePaymentDto } from '@/api/maintenanceApi';
import { handleApiError, formatValidationErrors } from '@/api/errorHandler';
import { usePaymentModes } from '@/hooks/usePaymentModes';

export function PaymentForm({ flatPublicId, onSuccess }: Props) {
  const { modes, loading: modesLoading } = usePaymentModes();
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString(),
    paymentModeCode: '',
    referenceNumber: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload: CreateMaintenancePaymentDto = {
        flatPublicId,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentModeCode: formData.paymentModeCode,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      };

      await maintenanceApi.createPayment(payload);
      
      showToast({ 
        title: 'Success', 
        description: 'Payment recorded successfully' 
      });

      onSuccess();
    } catch (error) {
      handleApiError(error, {
        onValidationError: (errors) => {
          setFieldErrors(formatValidationErrors(errors));
        }
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Amount *</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        {fieldErrors.amount && <span className="error">{fieldErrors.amount}</span>}
      </div>

      <div>
        <label>Payment Mode *</label>
        <select
          value={formData.paymentModeCode}
          onChange={(e) => setFormData({ ...formData, paymentModeCode: e.target.value })}
          required
        >
          <option value="">Select payment mode</option>
          {modes.map(mode => (
            <option key={mode.code} value={mode.code}>
              {mode.displayName}
            </option>
          ))}
        </select>
        {fieldErrors.paymentModeCode && <span className="error">{fieldErrors.paymentModeCode}</span>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Record Payment'}
      </button>
    </form>
  );
}
```

---

## Additional Tips

### 1. Always Use UUID (publicId)
Never use internal IDs. Always use `publicId` (UUID format) for all entity references.

### 2. Handle Subscription Status
Check subscription status before allowing access to protected features:

```typescript
const { isActive, isTrial } = useSubscriptionStatus();

if (!isActive) {
  return <SubscriptionRequired />;
}
```

### 3. Society Isolation
No need to pass `societyId` - it's automatically extracted from JWT token.

### 4. Date Formats
Use ISO 8601 format for dates:
- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DDTHH:mm:ss.fffZ`

### 5. Error Handling
Always use the error handler utilities for consistent error handling across the app.

### 6. Token Refresh
Token refresh is automatic via interceptor. Just ensure refresh token is stored properly.

### 7. Loading States
Always show loading states while API calls are in progress.

### 8. Validation
Display field-level validation errors next to form fields for better UX.
