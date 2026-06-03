import { GameResult, RoundStatus, type Prisma, type TournamentRegistration } from "@prisma/client";

type Player = Pick<TournamentRegistration, "id" | "startNumber">;
type Slot = Player | null;

export type RoundRobinPairing = {
  roundNumber: number;
  boardNumber: number;
  whiteRegistrationId: string;
  blackRegistrationId?: string;
  result?: GameResult;
  whitePoints?: number;
  blackPoints?: number;
};

export function generateRoundRobinSchedule(players: Player[]): RoundRobinPairing[] {
  const orderedPlayers = [...players].sort((a, b) => (a.startNumber ?? 9999) - (b.startNumber ?? 9999));
  const slots: Slot[] = orderedPlayers.length % 2 === 0 ? orderedPlayers : [...orderedPlayers, null];
  const roundsCount = slots.length - 1;
  const gamesPerRound = slots.length / 2;
  const schedule: RoundRobinPairing[] = [];

  for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
    for (let boardIndex = 0; boardIndex < gamesPerRound; boardIndex += 1) {
      const first = slots[boardIndex];
      const second = slots[slots.length - 1 - boardIndex];

      if (!first || !second) {
        const player = first ?? second;
        if (player) {
          schedule.push({
            roundNumber: roundIndex + 1,
            boardNumber: boardIndex + 1,
            whiteRegistrationId: player.id,
            result: GameResult.BYE,
            whitePoints: 1,
            blackPoints: 0
          });
        }
        continue;
      }

      const swapColors = (roundIndex + boardIndex) % 2 === 1;
      const fixedBoardSwap = boardIndex === 0 && roundIndex % 2 === 1;
      const white = swapColors !== fixedBoardSwap ? second : first;
      const black = swapColors !== fixedBoardSwap ? first : second;

      schedule.push({
        roundNumber: roundIndex + 1,
        boardNumber: boardIndex + 1,
        whiteRegistrationId: white.id,
        blackRegistrationId: black.id
      });
    }

    const fixed = slots[0];
    const rotating = slots.slice(1);
    rotating.unshift(rotating.pop() ?? null);
    slots.splice(0, slots.length, fixed, ...rotating);
  }

  return schedule;
}

export async function createRoundRobinRounds(tx: Prisma.TransactionClient, tournamentId: string, players: Player[]) {
  const schedule = generateRoundRobinSchedule(players);
  const roundsCount = players.length % 2 === 0 ? players.length - 1 : players.length;

  for (let roundNumber = 1; roundNumber <= roundsCount; roundNumber += 1) {
    const round = await tx.round.create({
      data: {
        tournamentId,
        roundNumber,
        status: roundNumber === 1 ? RoundStatus.PAIRINGS_PUBLISHED : RoundStatus.NOT_STARTED
      }
    });

    await tx.game.createMany({
      data: schedule
        .filter((pairing) => pairing.roundNumber === roundNumber)
        .map((pairing) => ({
          tournamentId,
          roundId: round.id,
          boardNumber: pairing.boardNumber,
          whiteRegistrationId: pairing.whiteRegistrationId,
          blackRegistrationId: pairing.blackRegistrationId,
          result: pairing.result ?? GameResult.NOT_PLAYED,
          whitePoints: pairing.whitePoints ?? 0,
          blackPoints: pairing.blackPoints ?? 0
        }))
    });
  }
}
