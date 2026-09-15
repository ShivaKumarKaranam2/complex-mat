import { apiRequest } from "./apiClient";
import type { Role } from "./authApi";

export interface UserSummary {
  id: number;
  employeeName: string;
  employeeMailId: string;
  employeeId: string;
  role: Role;
  isActive: boolean;
}

export function searchUsers(q: string): Promise<UserSummary[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  return apiRequest<UserSummary[]>(`/api/users?${params.toString()}`);
}
