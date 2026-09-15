import { apiRequest } from "./apiClient";

export type Role = "ADMIN" | "TEAM_MEMBER";

export interface AuthUser {
  id: number;
  employeeName: string;
  employeeMailId: string;
  employeeId: string;
  role: Role;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(employeeMailId: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { employeeMailId, password },
  });
}

export function me(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/auth/me");
}
