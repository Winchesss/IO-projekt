import type { GameResult } from "@prisma/client";

export type GameScore = {
  whitePoints: number;
  blackPoints: number;
};

export type StandingAccumulator = {
  registrationId: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  forfeits: number;
  opponentIds: string[];
  opponentResults: Array<{ opponentId: string; score: number }>;
  buchholz: number;
  medianBuchholz: number;
  sonnebornBerger: number;
  progressiveScore: number;
};

export type EngineResult = {
  ok: boolean;
  message?: string;
};

export const playableResults: GameResult[] = [
  "WHITE_WIN",
  "BLACK_WIN",
  "DRAW",
  "WHITE_FORFEIT",
  "BLACK_FORFEIT",
  "DOUBLE_FORFEIT",
  "BYE"
];
