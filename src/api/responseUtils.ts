export function unwrapArrayData<T>(data: unknown, keyHint?: string): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    if (keyHint && Array.isArray((data as Record<string, unknown>)[keyHint])) {
      return (data as Record<string, unknown>)[keyHint] as T[];
    }

    const arrayValues = Object.values(data).filter(Array.isArray) as T[][];
    if (arrayValues.length === 1) {
      return arrayValues[0];
    }
  }

  return [];
}