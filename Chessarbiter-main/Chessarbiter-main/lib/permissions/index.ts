import "server-only";

import { redirect } from "next/navigation";
import { RegistrationStatus, UserRole, type Tournament, type TournamentRegistration } from "@prisma/client";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/logowanie");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
}

export async function requireArbiterOrAdmin() {
  const user = await requireAuth();

  if (user.role !== UserRole.ARBITER && user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
}

export function canManageTournament(user: SessionUser, tournament: Pick<Tournament, "createdById">) {
  return user.role === UserRole.ADMIN || tournament.createdById === user.id;
}

export function canUserManageTournament(user: SessionUser, tournament: Pick<Tournament, "createdById">) {
  return canManageTournament(user, tournament);
}

export function canEditTournament(user: SessionUser, tournament: Pick<Tournament, "createdById" | "status">) {
  return canManageTournament(user, tournament) && tournament.status !== "FINISHED";
}

export function canRunTournament(user: SessionUser, tournament: Pick<Tournament, "createdById" | "status">) {
  return canManageTournament(user, tournament) && ["PUBLISHED", "REGISTRATION_CLOSED", "IN_PROGRESS"].includes(tournament.status);
}

export function canManageRegistration(
  user: SessionUser,
  registration: Pick<TournamentRegistration, "userId" | "status"> & { tournament: Pick<Tournament, "createdById"> }
) {
  if (canManageTournament(user, registration.tournament)) {
    return true;
  }

  return (
    registration.userId === user.id &&
    (registration.status === RegistrationStatus.REGISTERED || registration.status === RegistrationStatus.WAITLIST)
  );
}
