export interface User {
  id: string;
  nim: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export type Role =
  | "SUPER_ADMIN"
  | "KURIKULUM"
  | "SEKRETARIS"
  | "KOMTI"
  | "WAKOMTI"
  | "MAHASISWA";

export interface AuthResponse {
  token: string;
  user: User;
  role: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  nim: string;
  full_name: string;
  email: string;
  password: string;
}
