/**
 * Role-Based Access Control (RBAC) utilities
 * Role names must match backend exactly
 */

export const ROLES = {
  MAHASISWA: 'MAHASISWA',
  KURIKULUM: 'KURIKULUM',
  SEKRETARIS: 'SEKRETARIS',
  KOMTI: 'KOMTI',
  WAKOMTI: 'WAKOMTI',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Check if user has access to a specific role
 */
export function canAccessRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is any admin role
 */
export function isAdmin(userRole: string | null): boolean {
  if (!userRole) return false;
  const adminRoles = [ROLES.KURIKULUM, ROLES.SEKRETARIS, ROLES.KOMTI, ROLES.WAKOMTI, ROLES.SUPER_ADMIN] as const;
  return adminRoles.includes(userRole as typeof adminRoles[number]);
}

/**
 * Check if user can manage academic content (curriculum, materials, assignments)
 */
export function canManageAcademic(userRole: string | null): boolean {
  if (!userRole) return false;
  const allowedRoles = [ROLES.KURIKULUM, ROLES.SUPER_ADMIN] as const;
  return allowedRoles.includes(userRole as typeof allowedRoles[number]);
}

/**
 * Check if user can manage calendar events
 */
export function canManageCalendar(userRole: string | null): boolean {
  if (!userRole) return false;
  const allowedRoles = [ROLES.SEKRETARIS, ROLES.SUPER_ADMIN] as const;
  return allowedRoles.includes(userRole as typeof allowedRoles[number]);
}

/**
 * Check if user can manage other users (role assignment, password reset)
 */
export function canManageUsers(userRole: string | null): boolean {
  if (!userRole) return false;
  return userRole === ROLES.SUPER_ADMIN;
}

/**
 * Check if user can manage bank soal (admin-level access)
 */
export function canManageBankSoal(userRole: string | null): boolean {
  if (!userRole) return false;
  const allowedRoles = [ROLES.KURIKULUM, ROLES.SUPER_ADMIN] as const;
  return allowedRoles.includes(userRole as typeof allowedRoles[number]);
}

/**
 * Check if user can view monitoring data
 */
export function canViewMonitoring(userRole: string | null): boolean {
  if (!userRole) return false;
  const allowedRoles = [ROLES.SEKRETARIS, ROLES.KOMTI, ROLES.WAKOMTI, ROLES.SUPER_ADMIN] as const;
  return allowedRoles.includes(userRole as typeof allowedRoles[number]);
}
