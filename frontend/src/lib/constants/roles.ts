import type { Role } from "@/types";

export const ROLES: Role[] = [
  "SUPER_ADMIN",
  "KURIKULUM",
  "SEKRETARIS",
  "KOMTI",
  "WAKOMTI",
  "MAHASISWA",
];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  KURIKULUM: "Kurikulum",
  SEKRETARIS: "Sekretaris",
  KOMTI: "Komti",
  WAKOMTI: "Wakomti",
  MAHASISWA: "Mahasiswa",
};

export const ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "KURIKULUM",
  "SEKRETARIS",
  "KOMTI",
  "WAKOMTI",
];

export const CURRICULUM_WRITE_ROLES: Role[] = ["SUPER_ADMIN", "KURIKULUM"];

export const CALENDAR_WRITE_ROLES: Role[] = ["SUPER_ADMIN", "SEKRETARIS"];

export const MONITORING_ROLES: Role[] = [
  "SUPER_ADMIN",
  "KURIKULUM",
  "SEKRETARIS",
  "KOMTI",
  "WAKOMTI",
];
