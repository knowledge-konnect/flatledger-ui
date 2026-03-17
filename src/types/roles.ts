
/** Numeric DB primary key for each role */
export enum RoleId {
  SOCIETY_ADMIN = 1,
  VIEWER        = 6,
}

/** Short code stored in the JWT / API payloads */
export enum RoleCode {
  SOCIETY_ADMIN = 'society_admin',
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
  [RoleId.VIEWER]:        RoleCode.VIEWER,
};

export const ROLE_CODE_TO_ID: Record<RoleCode, RoleId> = {
  [RoleCode.SOCIETY_ADMIN]: RoleId.SOCIETY_ADMIN,
  [RoleCode.VIEWER]:        RoleId.VIEWER,
};

/** Maps RoleCode → display name */
export const ROLE_LABELS: Record<RoleCode, RoleDisplayName> = {
  [RoleCode.SOCIETY_ADMIN]: RoleDisplayName.SOCIETY_ADMIN,
  [RoleCode.VIEWER]:        RoleDisplayName.VIEWER,
};

/** Maps display name string → RoleCode (for converting API roleDisplayName back to code) */
export const ROLE_DISPLAY_TO_CODE: Record<string, RoleCode> = {
  [RoleDisplayName.SOCIETY_ADMIN]: RoleCode.SOCIETY_ADMIN,
  [RoleDisplayName.VIEWER]:        RoleCode.VIEWER,
};

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  [RoleCode.SOCIETY_ADMIN]: 'Full access to all features',
  [RoleCode.VIEWER]:        'Read-only access',
};

// ---------------------------------------------------------------------------
// Permission groups (only two roles now)
// ---------------------------------------------------------------------------

/** Roles allowed to access admin-level features (user management, society settings) */
export const ADMIN_ROLE_CODES: RoleCode[] = [RoleCode.SOCIETY_ADMIN];

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
  const normalized = new Set(rolesToCheck.map(r =>
    typeof r === 'string' ? r.toLowerCase() : String(r).toLowerCase()
  ));
  return userRoles.some(r =>
    typeof r === 'string' && normalized.has(r.toLowerCase())
  );
}

/**
 * Returns true when the user holds Society Admin role.
 * Accepts both role code ('society_admin') and display name ('Society Admin').
 */
export function isAdminRole(
  userRoles: (string | undefined | null)[] | undefined | null,
): boolean {
  return hasRole(
    userRoles,
    RoleCode.SOCIETY_ADMIN, RoleDisplayName.SOCIETY_ADMIN,
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
