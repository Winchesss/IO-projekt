"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { GameResult, RegistrationStatus, RoundStatus, TournamentStatus, TournamentType } from "@prisma/client";
import { requireArbiterOrAdmin } from "@/lib/permissions";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import {
  completeRoundSchema,
  createRoundSchema,
  finishTournamentSchema,
  gameResultSchema,
  manualPairingSchema,
  manualParticipantSchema,
  recalculateStandingsSchema,
  startTournamentSchema
} from "@/lib/validators/engine";
import { startTournament } from "@/lib/tournament-engine/startTournament";
import { isEnteredResult, scoreForResult } from "@/lib/tournament-engine/results";
import { recalculateStandings } from "@/lib/tournament-engine/standings";
import { generateSwissRound } from "@/lib/tournament-engine/swiss";

export type EngineActionState = {
  success?: string;
  error?: string;
};

export async function startTournamentAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = startTournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);

  try {
    await startTournament(tournament.id);
    await recalculateStandings(tournament.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się rozpocząć turnieju." };
  }

  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Turniej został rozpoczęty. Harmonogram, numery startowe i tabela zostały przygotowane." };
}

export async function createManualRoundAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = createRoundSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    return { error: "Rundy można tworzyć po rozpoczęciu turnieju." };
  }
  if (tournament.tournamentType === TournamentType.ROUND_ROBIN) {
    return { error: "Turniej kołowy ma harmonogram tworzony automatycznie przy starcie." };
  }
  if (tournament.tournamentType === TournamentType.SWISS) {
    return { error: "Turniej szwajcarski używa generatora Swiss MVP." };
  }

  const existingOpenRound = await prisma.round.findFirst({
    where: { tournamentId: tournament.id, status: { not: RoundStatus.COMPLETED } },
    select: { id: true }
  });

  if (existingOpenRound) {
    return { error: "Najpierw zakończ bieżącą rundę." };
  }

  const [lastRound, registrations] = await Promise.all([
    prisma.round.findFirst({
      where: { tournamentId: tournament.id },
      orderBy: { roundNumber: "desc" },
      select: { roundNumber: true }
    }),
    prisma.tournamentRegistration.findMany({
      where: { tournamentId: tournament.id, status: RegistrationStatus.REGISTERED },
      orderBy: [{ startNumber: "asc" }, { rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
    })
  ]);

  if (registrations.length < 2) {
    return { error: "Do utworzenia rundy potrzeba co najmniej dwóch aktywnych zawodników." };
  }

  const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: {
        tournamentId: tournament.id,
        roundNumber,
        status: RoundStatus.PAIRINGS_PUBLISHED
      }
    });

    const gameData = [];
    for (let index = 0; index < registrations.length; index += 2) {
      const white = registrations[index];
      const black = registrations[index + 1];

      if (!black) {
        gameData.push({
          tournamentId: tournament.id,
          roundId: round.id,
          boardNumber: gameData.length + 1,
          whiteRegistrationId: white.id,
          result: GameResult.BYE,
          whitePoints: 1,
          blackPoints: 0
        });
      } else {
        gameData.push({
          tournamentId: tournament.id,
          roundId: round.id,
          boardNumber: gameData.length + 1,
          whiteRegistrationId: white.id,
          blackRegistrationId: black.id
        });
      }
    }

    await tx.game.createMany({ data: gameData });
  });

  await recalculateStandings(tournament.id);
  revalidateTournament(tournament.id, tournament.slug);
  return { success: `Runda ${roundNumber} została utworzona.` };
}

export async function generateNextSwissRoundAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = createRoundSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  if (tournament.tournamentType !== TournamentType.SWISS) {
    return { error: "Ten przycisk dotyczy tylko turniejów szwajcarskich." };
  }

  try {
    const result = await generateSwissRound(tournament.id);
    revalidateTournament(tournament.id, tournament.slug);
    const warning = result.warnings.length ? ` ${result.warnings.join(" ")}` : "";
    return { success: `Wygenerowano rundę ${result.roundNumber}.${warning}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się wygenerować rundy." };
  }
}

export async function enterGameResultAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = gameResultSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Wybierz poprawny wynik." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    return { error: "Wyniki można wpisywać tylko w trakcie turnieju." };
  }

  const game = await prisma.game.findUnique({
    where: { id: parsed.data.gameId },
    include: { round: true }
  });

  if (!game || game.tournamentId !== tournament.id) {
    return { error: "Nie znaleziono partii." };
  }
  if (game.round.status === RoundStatus.NOT_STARTED) {
    return { error: "Ta runda nie jest jeszcze otwarta." };
  }
  if (game.round.status === RoundStatus.COMPLETED) {
    return { error: "Nie można edytować wyników zakończonej rundy." };
  }

  const previousOpenRound = await prisma.round.findFirst({
    where: {
      tournamentId: tournament.id,
      roundNumber: { lt: game.round.roundNumber },
      status: { not: RoundStatus.COMPLETED }
    },
    select: { id: true }
  });

  if (previousOpenRound) {
    return { error: "Najpierw zakończ wcześniejsze rundy." };
  }

  const score = scoreForResult(parsed.data.result);
  await prisma.$transaction([
    prisma.game.update({
      where: { id: game.id },
      data: {
        result: parsed.data.result,
        whitePoints: score.whitePoints,
        blackPoints: score.blackPoints,
        resultEnteredById: user.id,
        resultEnteredAt: new Date()
      }
    }),
    prisma.round.update({
      where: { id: game.roundId },
      data: { status: RoundStatus.IN_PROGRESS }
    })
  ]);

  await recalculateStandings(tournament.id);
  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Wynik został zapisany." };
}

export async function completeRoundAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = completeRoundSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowa runda." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  const round = await prisma.round.findUnique({
    where: { id: parsed.data.roundId },
    include: { games: true }
  });

  if (!round || round.tournamentId !== tournament.id) {
    return { error: "Nie znaleziono rundy." };
  }
  if (round.games.length === 0 || round.games.some((game) => !isEnteredResult(game.result))) {
    return { error: "Rundę można zakończyć dopiero po wpisaniu wszystkich wyników." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: round.id },
      data: { status: RoundStatus.COMPLETED }
    });

    const nextRound = await tx.round.findFirst({
      where: { tournamentId: tournament.id, roundNumber: { gt: round.roundNumber } },
      orderBy: { roundNumber: "asc" }
    });

    if (nextRound && nextRound.status === RoundStatus.NOT_STARTED) {
      await tx.round.update({
        where: { id: nextRound.id },
        data: { status: RoundStatus.PAIRINGS_PUBLISHED }
      });
    }
  });

  await recalculateStandings(tournament.id);
  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Runda została zakończona, a tabela przeliczona." };
}

export async function finishTournamentAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = finishTournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  const [incompleteRound, completedRoundsCount] = await Promise.all([
    prisma.round.findFirst({
      where: { tournamentId: tournament.id, status: { not: RoundStatus.COMPLETED } },
      select: { id: true }
    }),
    prisma.round.count({ where: { tournamentId: tournament.id, status: RoundStatus.COMPLETED } })
  ]);

  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    return { error: "Zakończyć można tylko trwający turniej." };
  }
  if (incompleteRound) {
    return { error: "Najpierw zakończ wszystkie rundy." };
  }
  if (tournament.tournamentType === TournamentType.SWISS && completedRoundsCount < tournament.rounds) {
    return { error: "Turniej szwajcarski można zakończyć po rozegraniu wszystkich zaplanowanych rund." };
  }

  await recalculateStandings(tournament.id);
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: TournamentStatus.FINISHED, registrationOpen: false }
  });

  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Turniej został zakończony." };
}

export async function finishTournamentEarlyAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = finishTournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    return { error: "Wcześniej zakończyć można tylko trwający turniej." };
  }

  const completedRoundsCount = await prisma.round.count({
    where: { tournamentId: tournament.id, status: RoundStatus.COMPLETED }
  });
  if (completedRoundsCount === 0) {
    return { error: "Do wcześniejszego zakończenia potrzeba co najmniej jednej zakończonej rundy." };
  }

  await recalculateStandings(tournament.id);
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: TournamentStatus.FINISHED, registrationOpen: false }
  });

  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Turniej został zakończony wcześniej. Aktualna tabela jest końcowa." };
}

export async function recalculateStandingsAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = recalculateStandingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowy turniej." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  await recalculateStandings(tournament.id);
  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Tabela została przeliczona." };
}

export async function addManualParticipantAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = manualParticipantSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Uzupełnij dane zawodnika ręcznego." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  const lastStart = await prisma.tournamentRegistration.findFirst({
    where: { tournamentId: tournament.id },
    orderBy: { startNumber: "desc" },
    select: { startNumber: true }
  });

  await prisma.tournamentRegistration.create({
    data: {
      tournamentId: tournament.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: `manual-${randomUUID()}@pairing.local`,
      clubOrCity: parsed.data.clubOrCity,
      rating: parsed.data.rating,
      chessCategory: parsed.data.chessCategory,
      birthYear: parsed.data.birthYear,
      status: RegistrationStatus.REGISTERED,
      startNumber: (lastStart?.startNumber ?? 0) + 1,
      notes: "Dodano ręcznie w module kojarzeń."
    }
  });

  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Zawodnik został dodany ręcznie." };
}

export async function addManualPairingAction(_: EngineActionState, formData: FormData): Promise<EngineActionState> {
  const user = await requireArbiterOrAdmin();
  const parsed = manualPairingSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Uzupełnij poprawnie kojarzenie." };
  }

  const tournament = await requireTournamentManager(user, parsed.data.tournamentId);
  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    return { error: "Kojarzenia ręczne można dodawać w trakcie turnieju." };
  }

  const blackRegistrationId = parsed.data.blackRegistrationId || null;
  if (blackRegistrationId && blackRegistrationId === parsed.data.whiteRegistrationId) {
    return { error: "Ten sam zawodnik nie może grać z samym sobą." };
  }

  const round = await prisma.round.upsert({
    where: { tournamentId_roundNumber: { tournamentId: tournament.id, roundNumber: parsed.data.roundNumber } },
    create: { tournamentId: tournament.id, roundNumber: parsed.data.roundNumber, status: RoundStatus.PAIRINGS_PUBLISHED },
    update: {}
  });

  const playerIds = [parsed.data.whiteRegistrationId, blackRegistrationId].filter(Boolean) as string[];
  const duplicatePlayer = await prisma.game.findFirst({
    where: {
      roundId: round.id,
      OR: playerIds.flatMap((id) => [{ whiteRegistrationId: id }, { blackRegistrationId: id }])
    },
    select: { id: true }
  });
  if (duplicatePlayer) {
    return { error: "Zawodnik jest już skojarzony w tej rundzie." };
  }

  const boardTaken = await prisma.game.findUnique({
    where: { roundId_boardNumber: { roundId: round.id, boardNumber: parsed.data.boardNumber } },
    select: { id: true }
  });
  if (boardTaken) {
    return { error: "Ten numer szachownicy jest już zajęty w tej rundzie." };
  }

  await prisma.game.create({
    data: {
      tournamentId: tournament.id,
      roundId: round.id,
      boardNumber: parsed.data.boardNumber,
      whiteRegistrationId: parsed.data.whiteRegistrationId,
      blackRegistrationId,
      result: blackRegistrationId ? GameResult.NOT_PLAYED : GameResult.BYE,
      whitePoints: blackRegistrationId ? 0 : 1,
      blackPoints: 0
    }
  });

  await recalculateStandings(tournament.id);
  revalidateTournament(tournament.id, tournament.slug);
  return { success: "Kojarzenie zostało dodane ręcznie." };
}

function revalidateTournament(tournamentId: string, slug: string) {
  revalidatePath("/panel-sedziego");
  revalidatePath(`/panel-sedziego/turnieje/${tournamentId}/rundy`);
  revalidatePath(`/panel-sedziego/turnieje/${tournamentId}/kojarzenia`);
  revalidatePath(`/panel-sedziego/kojarzenia`);
  revalidatePath(`/panel-sedziego/kojarzenia/${tournamentId}`);
  revalidatePath(`/panel-sedziego/turnieje/${tournamentId}/wyniki`);
  revalidatePath(`/panel-sedziego/turnieje/${tournamentId}/tabela`);
  revalidatePath(`/turnieje/${slug}`);
  revalidatePath(`/turnieje/${slug}/lista-startowa`);
  revalidatePath(`/turnieje/${slug}/rundy`);
  revalidatePath(`/turnieje/${slug}/wyniki`);
  revalidatePath(`/turnieje/${slug}/tabela`);
}
