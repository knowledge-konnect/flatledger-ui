import { useState, useCallback } from 'react';

/**
 * Optimistic UI Updates Hook
 * Provides instant feedback with rollback on failure
 */
export function useOptimisticUpdate<T>(
  initialData: T[],
  updateFn: (data: T[]) => Promise<T[]>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimisticUpdate = useCallback(
    async (optimisticData: T[]) => {
      // Store previous state for rollback
      const previousData = data;
      
      // Immediately update UI
      setData(optimisticData);
      setIsLoading(true);
      setError(null);

      try {
        // Perform actual update
        const result = await updateFn(optimisticData);
        setData(result);
        return { success: true, data: result };
      } catch (err) {
        // Rollback on failure
        setData(previousData);
        setError(err as Error);
        return { success: false, error: err as Error };
      } finally {
        setIsLoading(false);
      }
    },
    [data, updateFn]
  );

  return {
    data,
    isLoading,
    error,
    optimisticUpdate,
  };
}

/**
 * Optimistic Create
 */
export function useOptimisticCreate<T extends { id: string }>(
  initialData: T[],
  createFn: (item: Omit<T, 'id'>) => Promise<T>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const create = useCallback(
    async (newItem: Omit<T, 'id'>) => {
      // Create temporary item with fake ID
      const tempItem = { ...newItem, id: `temp-${Date.now()}` } as T;
      
      // Optimistically add to list
      setData(prev => [tempItem, ...prev]);
      setIsLoading(true);

      try {
        // Create on server
        const createdItem = await createFn(newItem);
        
        // Replace temp item with real one
        setData(prev => prev.map(item => item.id === tempItem.id ? createdItem : item));
        return { success: true, data: createdItem };
      } catch (err) {
        // Remove temp item on failure
        setData(prev => prev.filter(item => item.id !== tempItem.id));
        return { success: false, error: err as Error };
      } finally {
        setIsLoading(false);
      }
    },
    [createFn]
  );

  return { data, isLoading, create };
}

/**
 * Optimistic Delete
 */
export function useOptimisticDelete<T extends { id: string }>(
  initialData: T[],
  deleteFn: (id: string) => Promise<void>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const deleteItem = useCallback(
    async (id: string) => {
      // Store deleted item for rollback
      const deletedItem = data.find(item => item.id === id);
      if (!deletedItem) return { success: false, error: new Error('Item not found') };

      const previousData = data;
      
      // Optimistically remove from list
      setData(prev => prev.filter(item => item.id !== id));
      setIsLoading(true);

      try {
        // Delete on server
        await deleteFn(id);
        return { success: true };
      } catch (err) {
        // Restore item on failure
        setData(previousData);
        return { success: false, error: err as Error };
      } finally {
        setIsLoading(false);
      }
    },
    [data, deleteFn]
  );

  return { data, isLoading, deleteItem };
}

/**
 * Optimistic Toggle (for status changes)
 */
export function useOptimisticToggle<T extends { id: string }>(
  initialData: T[],
  toggleFn: (id: string, newState: Partial<T>) => Promise<T>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(
    async (id: string, updates: Partial<T>) => {
      const previousData = data;
      
      // Optimistically update state
      setData(prev =>
        prev.map(item => (item.id === id ? { ...item, ...updates } : item))
      );
      setIsLoading(true);

      try {
        // Update on server
        const updated = await toggleFn(id, updates);
        setData(prev => prev.map(item => (item.id === id ? updated : item)));
        return { success: true, data: updated };
      } catch (err) {
        // Rollback on failure
        setData(previousData);
        return { success: false, error: err as Error };
      } finally {
        setIsLoading(false);
      }
    },
    [data, toggleFn]
  );

  return { data, isLoading, toggle };
}
