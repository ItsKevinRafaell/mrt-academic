import type { Role } from "@/types";
import {
  ADMIN_ROLES,
  CURRICULUM_WRITE_ROLES,
  CALENDAR_WRITE_ROLES,
  MONITORING_ROLES,
} from "@/lib/constants/roles";

export function canAccessAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canWriteCurriculum(role: Role): boolean {
  return CURRICULUM_WRITE_ROLES.includes(role);
}

export function canWriteCalendar(role: Role): boolean {
  return CALENDAR_WRITE_ROLES.includes(role);
}

export function canViewMonitoring(role: Role): boolean {
  return MONITORING_ROLES.includes(role);
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}
