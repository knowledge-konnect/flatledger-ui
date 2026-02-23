import { AuditFields } from '../types';

/**
 * Utility functions for handling audit tracking
 * 
 * These utilities help manage audit fields, soft deletes, and audit trail display
 * across the application for production-grade financial traceability.
 */

/**
 * Filter out soft-deleted records
 * @param records Array of records with deletedAt field
 * @returns Array of active (non-deleted) records
 */
export function excludeDeleted<T extends { deletedAt?: string | null }>(
  records: T[]
): T[] {
  return records.filter(record => !record.deletedAt);
}

/**
 * Check if a record is soft-deleted
 */
export function isDeleted(record: { deletedAt?: string | null }): boolean {
  return !!record.deletedAt;
}

/**
 * Check if a record is active (not soft-deleted)
 */
export function isActive(record: { deletedAt?: string | null }): boolean {
  return !record.deletedAt;
}

/**
 * Get audit metadata for display
 */
export function getAuditMetadata(record: Partial<AuditFields>): {
  created: { by?: string; at?: string };
  updated: { by?: string; at?: string };
  deleted: { by?: string; at?: string };
} {
  return {
    created: {
      by: record.createdByName || record.createdBy,
      at: record.createdAt,
    },
    updated: {
      by: record.updatedByName || record.updatedBy,
      at: record.updatedAt,
    },
    deleted: {
      by: record.deletedByName || record.deletedBy,
      at: record.deletedAt || undefined,
    },
  };
}

/**
 * Format audit timestamp for display
 */
export function formatAuditTimestamp(timestamp?: string): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get user-friendly audit trail message
 */
export function getAuditTrailMessage(record: Partial<AuditFields>): string {
  const metadata = getAuditMetadata(record);
  
  if (metadata.deleted.at) {
    return `Deleted by ${metadata.deleted.by || 'Unknown'} on ${formatAuditTimestamp(metadata.deleted.at)}`;
  }
  
  if (metadata.updated.at) {
    return `Updated by ${metadata.updated.by || 'Unknown'} on ${formatAuditTimestamp(metadata.updated.at)}`;
  }
  
  if (metadata.created.at) {
    return `Created by ${metadata.created.by || 'Unknown'} on ${formatAuditTimestamp(metadata.created.at)}`;
  }
  
  return 'No audit information';
}

/**
 * Compare two audit timestamps to determine which is more recent
 */
export function compareAuditTimestamps(
  timestamp1?: string,
  timestamp2?: string
): number {
  if (!timestamp1 && !timestamp2) return 0;
  if (!timestamp1) return 1;
  if (!timestamp2) return -1;
  
  const date1 = new Date(timestamp1).getTime();
  const date2 = new Date(timestamp2).getTime();
  
  return date2 - date1;
}

/**
 * Sort records by most recently updated/created
 */
export function sortByMostRecent<T extends Partial<AuditFields>>(
  records: T[]
): T[] {
  return [...records].sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt;
    const bTime = b.updatedAt || b.createdAt;
    return compareAuditTimestamps(aTime, bTime);
  });
}
