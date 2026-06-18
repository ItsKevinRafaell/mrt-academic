import { api, unwrapData } from "./client";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "@/types";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const res = await api.post("/auth/login", input);
  return unwrapData<AuthResponse>(res);
}

export async function register(input: RegisterInput): Promise<User> {
  const res = await api.post("/auth/register", input);
  return unwrapData<User>(res);
}

export async function getMe(): Promise<{ user: User; role: string }> {
  const res = await api.get("/auth/me");
  return unwrapData<{ user: User; role: string }>(res);
}
