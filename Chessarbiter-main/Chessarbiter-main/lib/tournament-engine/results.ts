import { GameResult } from "@prisma/client";
import type { GameScore } from "@/lib/tournament-engine/types";

export function scoreForResult(result: GameResult): GameScore {
  if (result === GameResult.WHITE_WIN || result === GameResult.BLACK_FORFEIT || result === GameResult.BYE) {
    return { whitePoints: 1, blackPoints: 0 };
  }

  if (result === GameResult.BLACK_WIN || result === GameResult.WHITE_FORFEIT) {
    return { whitePoints: 0, blackPoints: 1 };
  }

  if (result === GameResult.DRAW) {
    return { whitePoints: 0.5, blackPoints: 0.5 };
  }

  return { whitePoints: 0, blackPoints: 0 };
}

export function isEnteredResult(result: GameResult) {
  return result !== GameResult.NOT_PLAYED;
}

export function isForfeitResult(result: GameResult) {
  return result === GameResult.WHITE_FORFEIT || result === GameResult.BLACK_FORFEIT || result === GameResult.DOUBLE_FORFEIT;
}
