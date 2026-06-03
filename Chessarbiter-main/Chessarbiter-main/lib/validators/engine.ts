import { GameResult } from "@prisma/client";
import { z } from "zod";

export const startTournamentSchema = z.object({
  tournamentId: z.string().min(1)
});

export const createRoundSchema = z.object({
  tournamentId: z.string().min(1)
});

export const gameResultSchema = z.object({
  gameId: z.string().min(1),
  tournamentId: z.string().min(1),
  result: z.nativeEnum(GameResult).refine((value) => value !== GameResult.NOT_PLAYED, "Wybierz wynik.")
});

export const completeRoundSchema = z.object({
  roundId: z.string().min(1),
  tournamentId: z.string().min(1)
});

export const finishTournamentSchema = z.object({
  tournamentId: z.string().min(1)
});

export const recalculateStandingsSchema = z.object({
  tournamentId: z.string().min(1)
});

export const manualParticipantSchema = z.object({
  tournamentId: z.string().min(1),
  firstName: z.string().trim().min(1, "Podaj imię.").max(80),
  lastName: z.string().trim().min(1, "Podaj nazwisko.").max(80),
  clubOrCity: z.string().trim().min(1, "Podaj klub lub miasto.").max(120),
  rating: z.coerce.number().int("Podaj ranking jako liczbę.").min(0).max(4000),
  chessCategory: z.string().trim().max(30).optional().transform((value) => value || "NONE"),
  birthYear: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional()
  )
});

export const manualPairingSchema = z.object({
  tournamentId: z.string().min(1),
  roundNumber: z.coerce.number().int().min(1),
  boardNumber: z.coerce.number().int().min(1),
  whiteRegistrationId: z.string().min(1),
  blackRegistrationId: z.string().optional()
});
