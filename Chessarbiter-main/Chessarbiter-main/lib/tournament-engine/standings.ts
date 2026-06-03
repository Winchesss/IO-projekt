import { GameResult, RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isForfeitResult } from "@/lib/tournament-engine/results";
import type { StandingAccumulator } from "@/lib/tournament-engine/types";

type StandingRegistration = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
};

type StandingRound = {
  games: Array<{
    whiteRegistrationId: string | null;
    blackRegistrationId: string | null;
    result: GameResult;
    whitePoints: number;
    blackPoints: number;
  }>;
};

export async function recalculateStandings(tournamentId: string) {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: RegistrationStatus.REGISTERED },
    orderBy: [{ rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
  });

  const rounds = await prisma.round.findMany({
    where: { tournamentId },
    orderBy: { roundNumber: "asc" },
    include: { games: { orderBy: { boardNumber: "asc" } } }
  });
  const sorted = calculateStandingRows(registrations, rounds);

  await prisma.$transaction(async (tx) => {
    for (const [index, item] of sorted.entries()) {
      await tx.tournamentStanding.upsert({
        where: { tournamentId_registrationId: { tournamentId, registrationId: item.registration.id } },
        create: {
          tournamentId,
          registrationId: item.registration.id,
          points: item.standing.points,
          gamesPlayed: item.standing.gamesPlayed,
          wins: item.standing.wins,
          draws: item.standing.draws,
          losses: item.standing.losses,
          forfeits: item.standing.forfeits,
          buchholz: item.standing.buchholz,
          medianBuchholz: item.standing.medianBuchholz,
          sonnebornBerger: item.standing.sonnebornBerger,
          progressiveScore: item.standing.progressiveScore,
          rank: index + 1
        },
        update: {
          points: item.standing.points,
          gamesPlayed: item.standing.gamesPlayed,
          wins: item.standing.wins,
          draws: item.standing.draws,
          losses: item.standing.losses,
          forfeits: item.standing.forfeits,
          buchholz: item.standing.buchholz,
          medianBuchholz: item.standing.medianBuchholz,
          sonnebornBerger: item.standing.sonnebornBerger,
          progressiveScore: item.standing.progressiveScore,
          rank: index + 1
        }
      });

      await tx.tournamentRegistration.update({
        where: { id: item.registration.id },
        data: { finalRank: index + 1 }
      });
    }
  });
}

export function calculateStandingRows<TRegistration extends StandingRegistration, TRound extends StandingRound>(
  registrations: TRegistration[],
  rounds: TRound[]
) {
  const standings = new Map<string, StandingAccumulator>();
  for (const registration of registrations) {
    standings.set(registration.id, createStanding(registration.id));
  }

  for (const round of rounds) {
    for (const game of round.games) {
      applyGame(standings, game);
    }

    for (const standing of standings.values()) {
      standing.progressiveScore += standing.points;
    }
  }

  applyTiebreaks(standings);

  return registrations
    .map((registration) => ({ registration, standing: standings.get(registration.id)! }))
    .sort((a, b) => {
      if (b.standing.points !== a.standing.points) {
        return b.standing.points - a.standing.points;
      }
      if (b.standing.buchholz !== a.standing.buchholz) {
        return b.standing.buchholz - a.standing.buchholz;
      }
      if (b.standing.sonnebornBerger !== a.standing.sonnebornBerger) {
        return b.standing.sonnebornBerger - a.standing.sonnebornBerger;
      }
      if (b.standing.progressiveScore !== a.standing.progressiveScore) {
        return b.standing.progressiveScore - a.standing.progressiveScore;
      }
      if (b.registration.rating !== a.registration.rating) {
        return b.registration.rating - a.registration.rating;
      }
      const lastName = a.registration.lastName.localeCompare(b.registration.lastName, "pl");
      if (lastName !== 0) {
        return lastName;
      }
      return a.registration.firstName.localeCompare(b.registration.firstName, "pl");
    });
}

function createStanding(registrationId: string): StandingAccumulator {
  return {
    registrationId,
    points: 0,
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    forfeits: 0,
    opponentIds: [],
    opponentResults: [],
    buchholz: 0,
    medianBuchholz: 0,
    sonnebornBerger: 0,
    progressiveScore: 0
  };
}

function applyGame(standings: Map<string, StandingAccumulator>, game: {
  whiteRegistrationId: string | null;
  blackRegistrationId: string | null;
  result: GameResult;
  whitePoints: number;
  blackPoints: number;
}) {
  if (game.result === GameResult.NOT_PLAYED) {
    return;
  }

  if (game.result === GameResult.BYE) {
    const byePlayer = game.whiteRegistrationId ?? game.blackRegistrationId;
    const standing = byePlayer ? standings.get(byePlayer) : null;
    if (standing) {
      standing.points += 1;
      standing.wins += 1;
    }
    return;
  }

  const white = game.whiteRegistrationId ? standings.get(game.whiteRegistrationId) : null;
  const black = game.blackRegistrationId ? standings.get(game.blackRegistrationId) : null;

  if (!white || !black || !game.whiteRegistrationId || !game.blackRegistrationId) {
    return;
  }

  white.points += game.whitePoints;
  black.points += game.blackPoints;
  white.gamesPlayed += 1;
  black.gamesPlayed += 1;
  white.opponentIds.push(game.blackRegistrationId);
  black.opponentIds.push(game.whiteRegistrationId);
  white.opponentResults.push({ opponentId: game.blackRegistrationId, score: game.whitePoints });
  black.opponentResults.push({ opponentId: game.whiteRegistrationId, score: game.blackPoints });

  if (game.result === GameResult.DRAW) {
    white.draws += 1;
    black.draws += 1;
  } else if (game.whitePoints > game.blackPoints) {
    white.wins += 1;
    black.losses += 1;
  } else if (game.blackPoints > game.whitePoints) {
    black.wins += 1;
    white.losses += 1;
  } else {
    white.losses += 1;
    black.losses += 1;
  }

  if (isForfeitResult(game.result)) {
    white.forfeits += 1;
    black.forfeits += 1;
  }
}

function applyTiebreaks(standings: Map<string, StandingAccumulator>) {
  for (const standing of standings.values()) {
    const opponentScores = standing.opponentIds.map((opponentId) => standings.get(opponentId)?.points ?? 0);
    standing.buchholz = sum(opponentScores);
    standing.medianBuchholz = medianBuchholz(opponentScores);
    standing.sonnebornBerger = standing.opponentResults.reduce((total, result) => {
      const opponentScore = standings.get(result.opponentId)?.points ?? 0;
      if (result.score === 1) {
        return total + opponentScore;
      }
      if (result.score === 0.5) {
        return total + opponentScore / 2;
      }
      return total;
    }, 0);
  }
}

function medianBuchholz(scores: number[]) {
  if (scores.length < 3) {
    return sum(scores);
  }

  const sorted = [...scores].sort((a, b) => a - b);
  return sum(sorted.slice(1, -1));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
