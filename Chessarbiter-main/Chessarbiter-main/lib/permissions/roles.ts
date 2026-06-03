import { UserRole } from "@prisma/client";

export function canAccessArbiterPanel(role: UserRole) {
  return role === UserRole.ARBITER || role === UserRole.ADMIN;
}

export function canAccessAdminPanel(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function assertAdminIsImmutable(targetRole: UserRole, nextRole: UserRole) {
  if (targetRole === UserRole.ADMIN && nextRole !== UserRole.ADMIN) {
    throw new Error("The administrator role cannot be removed.");
  }
}
