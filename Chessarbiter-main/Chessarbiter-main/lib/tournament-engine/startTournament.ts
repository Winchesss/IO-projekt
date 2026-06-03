import { RegistrationStatus, TournamentStatus, TournamentType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { canStartTournamentStatus } from "@/lib/tournament-status";
import { createRoundRobinRounds } from "@/lib/tournament-engine/roundRobin";
import { generateSwissRound } from "@/lib/tournament-engine/swiss";

export async function startTournament(tournamentId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, status: true, tournamentType: true }
    });

    if (!tournament) {
      throw new Error("Nie znaleziono turnieju.");
    }

    if (!canStartTournamentStatus(tournament.status)) {
      throw new Error("Turniej można rozpocząć tylko po opublikowaniu albo zamknięciu zapisów.");
    }

    const existingRound = await tx.round.findFirst({
      where: { tournamentId },
      select: { id: true }
    });

    if (existingRound) {
      throw new Error("Harmonogram został już utworzony dla tego turnieju.");
    }

    const registrations = await tx.tournamentRegistration.findMany({
      where: { tournamentId, status: RegistrationStatus.REGISTERED },
      orderBy: [{ rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
    });

    if (registrations.length < 2) {
      throw new Error("Do rozpoczęcia turnieju potrzeba co najmniej dwóch aktywnie zgłoszonych zawodników.");
    }

    for (const [index, registration] of registrations.entries()) {
      await tx.tournamentRegistration.update({
        where: { id: registration.id },
        data: {
          startNumber: index + 1,
          seedNumber: index + 1
        }
      });
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.IN_PROGRESS,
        registrationOpen: false
      }
    });

    await tx.tournamentStanding.deleteMany({ where: { tournamentId } });
    await tx.tournamentStanding.createMany({
      data: registrations.map((registration, index) => ({
        tournamentId,
        registrationId: registration.id,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: 0,
        progressiveScore: 0,
        rank: index + 1
      }))
    });

    if (tournament.tournamentType === TournamentType.ROUND_ROBIN) {
      await createRoundRobinRounds(
        tx,
        tournamentId,
        registrations.map((registration, index) => ({ ...registration, startNumber: index + 1 }))
      );
    }

    return { startedPlayers: registrations.length };
  });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { tournamentType: true }
  });

  if (tournament?.tournamentType === TournamentType.SWISS) {
    await generateSwissRound(tournamentId);
  }

  return result;
}
