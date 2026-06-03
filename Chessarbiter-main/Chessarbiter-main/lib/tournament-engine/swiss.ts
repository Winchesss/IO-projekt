import { GameResult, RegistrationStatus, RoundStatus, TournamentStatus, TournamentType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { recalculateStandings } from "@/lib/tournament-engine/standings";

type SwissPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  startNumber: number | null;
  points: number;
};

type SwissPairing = {
  whiteRegistrationId: string;
  blackRegistrationId?: string;
  result?: GameResult;
  whitePoints?: number;
  blackPoints?: number;
};

type SwissContext = {
  tournamentId: string;
  roundNumber: number;
  players: SwissPlayer[];
  previousOpponents: Map<string, Set<string>>;
  colorHistory: Map<string, string[]>;
  byePlayerIds: Set<string>;
};

export async function generateSwissRound(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, tournamentType: true, status: true, rounds: true }
  });

  if (!tournament) {
    throw new Error("Nie znaleziono turnieju.");
  }
  if (tournament.tournamentType !== TournamentType.SWISS) {
    throw new Error("Ten generator obsługuje tylko turnieje szwajcarskie.");
  }
  if (tournament.status !== TournamentStatus.IN_PROGRESS) {
    throw new Error("Rundy można generować tylko w trwającym turnieju.");
  }

  await recalculateStandings(tournamentId);

  const lastRound = await prisma.round.findFirst({
    where: { tournamentId },
    orderBy: { roundNumber: "desc" },
    include: { games: true }
  });

  if (lastRound && lastRound.status !== RoundStatus.COMPLETED) {
    throw new Error("Najpierw zakończ poprzednią rundę.");
  }

  const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
  if (roundNumber > tournament.rounds) {
    throw new Error("Wygenerowano już wszystkie zaplanowane rundy.");
  }

  const players = await loadSwissPlayers(tournamentId);
  if (players.length < 2) {
    throw new Error("Do wygenerowania rundy potrzeba co najmniej dwóch aktywnych zawodników.");
  }

  const context: SwissContext = {
    tournamentId,
    roundNumber,
    players,
    previousOpponents: await getPreviousOpponents(tournamentId),
    colorHistory: await getColorHistory(tournamentId),
    byePlayerIds: await getByePlayerIds(tournamentId)
  };
  const pairings = roundNumber === 1 ? generateFirstRound(players) : generateLaterRound(context);
  const repeatedPairings = pairings.filter(
    (pairing) =>
      pairing.blackRegistrationId &&
      context.previousOpponents.get(pairing.whiteRegistrationId)?.has(pairing.blackRegistrationId)
  ).length;

  await prisma.$transaction(async (tx) => {
    await createSwissRound(tx, tournamentId, roundNumber, pairings);
  });

  await recalculateStandings(tournamentId);
  return {
    roundNumber,
    pairingsCount: pairings.length,
    warnings: repeatedPairings > 0 ? [`${repeatedPairings} powtórzone kojarzenie było nieuniknione w tym MVP.`] : []
  };
}

export function getPlayerScore(player: SwissPlayer) {
  return player.points;
}

export async function getPreviousOpponents(tournamentId: string) {
  const games = await prisma.game.findMany({
    where: {
      tournamentId,
      whiteRegistrationId: { not: null },
      blackRegistrationId: { not: null }
    },
    select: { whiteRegistrationId: true, blackRegistrationId: true }
  });
  const opponents = new Map<string, Set<string>>();

  for (const game of games) {
    if (!game.whiteRegistrationId || !game.blackRegistrationId) {
      continue;
    }

    addOpponent(opponents, game.whiteRegistrationId, game.blackRegistrationId);
    addOpponent(opponents, game.blackRegistrationId, game.whiteRegistrationId);
  }

  return opponents;
}

export async function getColorHistory(tournamentId: string) {
  const games = await prisma.game.findMany({
    where: { tournamentId, result: { not: GameResult.BYE } },
    orderBy: [{ round: { roundNumber: "asc" } }, { boardNumber: "asc" }],
    select: { whiteRegistrationId: true, blackRegistrationId: true }
  });
  const history = new Map<string, string[]>();

  for (const game of games) {
    if (game.whiteRegistrationId) {
      history.set(game.whiteRegistrationId, [...(history.get(game.whiteRegistrationId) ?? []), "W"]);
    }
    if (game.blackRegistrationId) {
      history.set(game.blackRegistrationId, [...(history.get(game.blackRegistrationId) ?? []), "B"]);
    }
  }

  return history;
}

export function chooseByePlayer(players: SwissPlayer[], byePlayerIds: Set<string>) {
  const eligible = players.filter((player) => !byePlayerIds.has(player.id));
  const pool = eligible.length > 0 ? eligible : players;

  return [...pool].sort((a, b) => {
    if (a.points !== b.points) {
      return a.points - b.points;
    }
    if (a.rating !== b.rating) {
      return a.rating - b.rating;
    }
    return (b.startNumber ?? 9999) - (a.startNumber ?? 9999);
  })[0];
}

export function pairScoreGroup(
  players: SwissPlayer[],
  previousOpponents: Map<string, Set<string>>,
  colorHistory: Map<string, string[]>
) {
  const sorted = sortSwissPlayers(players);
  const topHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const bottomHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const pairings: SwissPairing[] = [];
  const remainingBottom = [...bottomHalf];

  for (const top of topHalf) {
    if (remainingBottom.length === 0) {
      break;
    }

    const candidateIndex = remainingBottom.findIndex((candidate) => !previousOpponents.get(top.id)?.has(candidate.id));
    const opponent = remainingBottom.splice(candidateIndex >= 0 ? candidateIndex : 0, 1)[0];
    pairings.push(assignColors(top, opponent, colorHistory));
  }

  return pairings;
}

export function assignColors(a: SwissPlayer, b: SwissPlayer, colorHistory: Map<string, string[]>): SwissPairing {
  const aHistory = colorHistory.get(a.id) ?? [];
  const bHistory = colorHistory.get(b.id) ?? [];
  const aNeedsWhite = colorNeed(aHistory);
  const bNeedsWhite = colorNeed(bHistory);

  if (aNeedsWhite !== bNeedsWhite) {
    return aNeedsWhite > bNeedsWhite
      ? { whiteRegistrationId: a.id, blackRegistrationId: b.id }
      : { whiteRegistrationId: b.id, blackRegistrationId: a.id };
  }

  const aBalance = colorBalance(aHistory);
  const bBalance = colorBalance(bHistory);
  if (aBalance !== bBalance) {
    return aBalance < bBalance
      ? { whiteRegistrationId: a.id, blackRegistrationId: b.id }
      : { whiteRegistrationId: b.id, blackRegistrationId: a.id };
  }

  return (a.startNumber ?? 9999) <= (b.startNumber ?? 9999)
    ? { whiteRegistrationId: a.id, blackRegistrationId: b.id }
    : { whiteRegistrationId: b.id, blackRegistrationId: a.id };
}

async function loadSwissPlayers(tournamentId: string): Promise<SwissPlayer[]> {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: RegistrationStatus.REGISTERED },
    include: { standing: true },
    orderBy: [{ startNumber: "asc" }, { rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
  });

  return registrations.map((registration) => ({
    id: registration.id,
    firstName: registration.firstName,
    lastName: registration.lastName,
    rating: registration.rating,
    startNumber: registration.startNumber,
    points: registration.standing?.points ?? 0
  }));
}

async function getByePlayerIds(tournamentId: string) {
  const games = await prisma.game.findMany({
    where: { tournamentId, result: GameResult.BYE },
    select: { whiteRegistrationId: true, blackRegistrationId: true }
  });

  return new Set(games.map((game) => game.whiteRegistrationId ?? game.blackRegistrationId).filter(Boolean) as string[]);
}

function generateFirstRound(players: SwissPlayer[]) {
  const sorted = [...players].sort((a, b) => (a.startNumber ?? 9999) - (b.startNumber ?? 9999));
  const pairings: SwissPairing[] = [];
  const bye = sorted.length % 2 === 1 ? sorted.pop() : null;
  const half = sorted.length / 2;

  for (let index = 0; index < half; index += 1) {
    const top = sorted[index];
    const bottom = sorted[index + half];
    pairings.push(
      index % 2 === 0
        ? { whiteRegistrationId: top.id, blackRegistrationId: bottom.id }
        : { whiteRegistrationId: bottom.id, blackRegistrationId: top.id }
    );
  }

  if (bye) {
    pairings.push({ whiteRegistrationId: bye.id, result: GameResult.BYE, whitePoints: 1, blackPoints: 0 });
  }

  return pairings;
}

function generateLaterRound(context: SwissContext) {
  let players = sortSwissPlayers(context.players);
  const pairings: SwissPairing[] = [];

  if (players.length % 2 === 1) {
    const bye = chooseByePlayer(players, context.byePlayerIds);
    players = players.filter((player) => player.id !== bye.id);
    pairings.push({ whiteRegistrationId: bye.id, result: GameResult.BYE, whitePoints: 1, blackPoints: 0 });
  }

  const groups = groupByScore(players);
  let floater: SwissPlayer | null = null;

  for (const group of groups) {
    const current: SwissPlayer[] = floater ? sortSwissPlayers([floater, ...group.players]) : group.players;
    floater = null;

    if (current.length % 2 === 1) {
      floater = current.pop() ?? null;
    }

    pairings.push(...pairScoreGroup(current, context.previousOpponents, context.colorHistory));
  }

  if (floater) {
    const opponent = findBestFallbackOpponent(floater, pairings, players, context.previousOpponents);
    if (opponent) {
      removePairingWithPlayer(pairings, opponent.id);
      pairings.push(assignColors(floater, opponent, context.colorHistory));
    }
  }

  return pairings.sort((a, b) => {
    const aWhite = players.find((player) => player.id === a.whiteRegistrationId)?.startNumber ?? 9999;
    const bWhite = players.find((player) => player.id === b.whiteRegistrationId)?.startNumber ?? 9999;
    return aWhite - bWhite;
  });
}

function groupByScore(players: SwissPlayer[]) {
  const groups = new Map<number, SwissPlayer[]>();
  for (const player of players) {
    const score = getPlayerScore(player);
    groups.set(score, [...(groups.get(score) ?? []), player]);
  }

  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([points, groupPlayers]) => ({ points, players: sortSwissPlayers(groupPlayers) }));
}

function sortSwissPlayers(players: SwissPlayer[]) {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return (a.startNumber ?? 9999) - (b.startNumber ?? 9999);
  });
}

async function createSwissRound(tx: Prisma.TransactionClient, tournamentId: string, roundNumber: number, pairings: SwissPairing[]) {
  const round = await tx.round.create({
    data: {
      tournamentId,
      roundNumber,
      status: RoundStatus.PAIRINGS_PUBLISHED
    }
  });

  await tx.game.createMany({
    data: pairings.map((pairing, index) => ({
      tournamentId,
      roundId: round.id,
      boardNumber: index + 1,
      whiteRegistrationId: pairing.whiteRegistrationId,
      blackRegistrationId: pairing.blackRegistrationId,
      result: pairing.result ?? GameResult.NOT_PLAYED,
      whitePoints: pairing.whitePoints ?? 0,
      blackPoints: pairing.blackPoints ?? 0
    }))
  });
}

function addOpponent(map: Map<string, Set<string>>, playerId: string, opponentId: string) {
  map.set(playerId, new Set([...(map.get(playerId) ?? []), opponentId]));
}

function colorNeed(history: string[]) {
  const lastTwo = history.slice(-2).join("");
  if (lastTwo === "WW") {
    return -2;
  }
  if (lastTwo === "BB") {
    return 2;
  }
  return 0;
}

function colorBalance(history: string[]) {
  return history.filter((color) => color === "W").length - history.filter((color) => color === "B").length;
}

function findBestFallbackOpponent(
  floater: SwissPlayer,
  pairings: SwissPairing[],
  players: SwissPlayer[],
  previousOpponents: Map<string, Set<string>>
) {
  const pairedIds = new Set(pairings.flatMap((pairing) => [pairing.whiteRegistrationId, pairing.blackRegistrationId]).filter(Boolean) as string[]);
  const candidates = players.filter((player) => player.id !== floater.id && pairedIds.has(player.id));

  return sortSwissPlayers(candidates).find((candidate) => !previousOpponents.get(floater.id)?.has(candidate.id)) ?? sortSwissPlayers(candidates)[0];
}

function removePairingWithPlayer(pairings: SwissPairing[], playerId: string) {
  const index = pairings.findIndex((pairing) => pairing.whiteRegistrationId === playerId || pairing.blackRegistrationId === playerId);
  if (index >= 0) {
    pairings.splice(index, 1);
  }
}
