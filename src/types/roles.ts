/**
 * Role enums — mirror the database roles table exactly.
 *
 * DB schema:
 *  id | code          | display_name
 *   1 | society_admin | Society Admin
 *   2 | admin         | Admin
 *   3 | treasurer     | Treasurer
 *   4 | secretary     | Secretary
 *   5 | manager       | Manager
 *   6 | viewer        | Viewer
 */

/** Numeric DB primary key for each role */
export enum RoleId {
  SOCIETY_ADMIN = 1,
  ADMIN         = 2,
  TREASURER     = 3,
  SECRETARY     = 4,
  MANAGER       = 5,
  VIEWER        = 6,
}

/** Short code stored in the JWT / API payloads */
export enum RoleCode {
  SOCIETY_ADMIN = 'society_admin',
  ADMIN         = 'admin',
  TREASURER     = 'treasurer',
  SECRETARY     = 'secretary',
  MANAGER       = 'manager',
  VIEWER        = 'viewer',
}

/** Human-readable display name returned by the API (roleDisplayName field) */
export enum RoleDisplayName {
  SOCIETY_ADMIN = 'Society Admin',
  ADMIN         = 'Admin',
  TREASURER     = 'Treasurer',
  SECRETARY     = 'Secretary',
  MANAGER       = 'Manager',
  VIEWER        = 'Viewer',
}

export const ROLE_ID_TO_CODE: Record<RoleId, RoleCode> = {
  [RoleId.SOCIETY_ADMIN]: RoleCode.SOCIETY_ADMIN,
  [RoleId.ADMIN]:         RoleCode.ADMIN,
  [RoleId.TREASURER]:     RoleCode.TREASURER,
  [RoleId.SECRETARY]:     RoleCode.SECRETARY,
  [RoleId.MANAGER]:       RoleCode.MANAGER,
  [RoleId.VIEWER]:        RoleCode.VIEWER,
};

export const ROLE_CODE_TO_ID: Record<RoleCode, RoleId> = {
  [RoleCode.SOCIETY_ADMIN]: RoleId.SOCIETY_ADMIN,
  [RoleCode.ADMIN]:         RoleId.ADMIN,
  [RoleCode.TREASURER]:     RoleId.TREASURER,
  [RoleCode.SECRETARY]:     RoleId.SECRETARY,
  [RoleCode.MANAGER]:       RoleId.MANAGER,
  [RoleCode.VIEWER]:        RoleId.VIEWER,
};

/** Maps RoleCode → display name */
export const ROLE_LABELS: Record<RoleCode, RoleDisplayName> = {
  [RoleCode.SOCIETY_ADMIN]: RoleDisplayName.SOCIETY_ADMIN,
  [RoleCode.ADMIN]:         RoleDisplayName.ADMIN,
  [RoleCode.TREASURER]:     RoleDisplayName.TREASURER,
  [RoleCode.SECRETARY]:     RoleDisplayName.SECRETARY,
  [RoleCode.MANAGER]:       RoleDisplayName.MANAGER,
  [RoleCode.VIEWER]:        RoleDisplayName.VIEWER,
};

/** Maps display name string → RoleCode (for converting API roleDisplayName back to code) */
export const ROLE_DISPLAY_TO_CODE: Record<string, RoleCode> = {
  [RoleDisplayName.SOCIETY_ADMIN]: RoleCode.SOCIETY_ADMIN,
  [RoleDisplayName.ADMIN]:         RoleCode.ADMIN,
  [RoleDisplayName.TREASURER]:     RoleCode.TREASURER,
  [RoleDisplayName.SECRETARY]:     RoleCode.SECRETARY,
  [RoleDisplayName.MANAGER]:       RoleCode.MANAGER,
  [RoleDisplayName.VIEWER]:        RoleCode.VIEWER,
};

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [RoleCode.SOCIETY_ADMIN]: 'Full access to all features',
  [RoleCode.ADMIN]:         'Administrative access to the society',
  [RoleCode.TREASURER]:     'Manage finances, expenses and billing',
  [RoleCode.SECRETARY]:     'Manage communications and records',
  [RoleCode.MANAGER]:       'Operational management access',
  [RoleCode.VIEWER]:        'Read-only access',
};

// ---------------------------------------------------------------------------
// Permission groups
// ---------------------------------------------------------------------------

/** Roles allowed to access admin-level features (user management, society settings) */
export const ADMIN_ROLE_CODES: RoleCode[] = [RoleCode.SOCIETY_ADMIN, RoleCode.ADMIN];

/** Roles allowed to access financial features (maintenance, expenses, opening balance) */
export const FINANCIAL_ROLE_CODES: RoleCode[] = [RoleCode.SOCIETY_ADMIN, RoleCode.ADMIN, RoleCode.TREASURER];

// ---------------------------------------------------------------------------
// Helper functions — use these instead of hardcoded string comparisons
// ---------------------------------------------------------------------------

/**
 * Returns true if any element of `userRoles` matches any of `rolesToCheck`.
 * Comparison is case-insensitive and works for both RoleCode and RoleDisplayName values.
 */
export function hasRole(
  userRoles: (string | undefined | null)[] | undefined | null,
  ...rolesToCheck: (RoleCode | RoleDisplayName | string)[]
): boolean {
  if (!userRoles?.length) return false;
  const normalized = new Set(rolesToCheck.map(r => r.toLowerCase()));
  return userRoles.some(r => r != null && normalized.has(r.toLowerCase()));
}

/**
 * Returns true when the user holds Society Admin or Admin role.
 * Accepts both role codes ('society_admin') and display names ('Society Admin').
 */
export function isAdminRole(
  userRoles: (string | undefined | null)[] | undefined | null,
): boolean {
  return hasRole(
    userRoles,
    RoleCode.SOCIETY_ADMIN, RoleDisplayName.SOCIETY_ADMIN,
    RoleCode.ADMIN,         RoleDisplayName.ADMIN,
  );
}

/**
 * Returns true when the user holds Society Admin, Admin, or Treasurer role.
 * Accepts both role codes and display names.
 */
export function isFinancialRole(
  userRoles: (string | undefined | null)[] | undefined | null,
): boolean {
  return hasRole(
    userRoles,
    RoleCode.SOCIETY_ADMIN, RoleDisplayName.SOCIETY_ADMIN,
    RoleCode.ADMIN,         RoleDisplayName.ADMIN,
    RoleCode.TREASURER,     RoleDisplayName.TREASURER,
  );
}

/** Collect all role values from the user object into a single flat array for role checks */
export function collectUserRoles(user: { roles?: string[] | null; role?: string | null; roleDisplayName?: string | null } | null | undefined): string[] {
  return [
    ...(user?.roles ?? []),
    ...(user?.role ? [user.role] : []),
    ...(user?.roleDisplayName ? [user.roleDisplayName] : []),
  ].filter(Boolean) as string[];
}
