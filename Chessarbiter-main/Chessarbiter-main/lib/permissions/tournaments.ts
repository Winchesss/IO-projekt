import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session";
import { canManageTournament } from "@/lib/permissions";

export async function requireTournamentManager(user: SessionUser, tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });

  if (!tournament || tournament.deletedAt || !canManageTournament(user, tournament)) {
    redirect("/panel-sedziego");
  }

  return tournament;
}
