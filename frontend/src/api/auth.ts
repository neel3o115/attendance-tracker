import { api } from "./client";
import type { LoginResponse } from "../types/auth";

export async function login(email: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { email, password });
  return res.data;
}

export async function register(name: string, email: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/register", {
    name,
    email,
    password,
  });

  return res.data;
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
