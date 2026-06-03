import { TimeControlType, TournamentStatus, TournamentType } from "@prisma/client";
import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalDate = z.string().optional().transform((value) => (value ? new Date(value) : undefined));
const optionalInt = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number({ invalid_type_error: "Podaj liczbę." }).int("Podaj liczbę całkowitą.").optional()
);

export const tournamentSchema = z
  .object({
    title: z.string().trim().min(3, "Podaj nazwę turnieju.").max(180),
    description: z.string().trim().min(10, "Opis musi mieć co najmniej 10 znaków."),
    location: z.string().trim().min(2, "Podaj miejsce rozgrywek.").max(160),
    city: z.string().trim().min(2, "Podaj miasto.").max(120),
    startDate: z.string().min(1, "Podaj datę rozpoczęcia.").transform((value) => new Date(value)),
    endDate: optionalDate,
    registrationDeadline: optionalDate,
    organizer: z.string().trim().min(2, "Podaj organizatora.").max(160),
    contactEmail: z.string().trim().email("Podaj poprawny e-mail.").toLowerCase(),
    contactPhone: optionalText,
    tournamentType: z.nativeEnum(TournamentType),
    timeControlType: z.nativeEnum(TimeControlType),
    timeControlDescription: z.string().trim().min(2, "Podaj tempo gry.").max(120),
    rounds: z.coerce.number().int().min(1, "Podaj liczbę rund.").max(99),
    maxPlayers: optionalInt.refine((value) => value === undefined || value > 0, "Limit musi być dodatni."),
    entryFee: optionalText,
    regulationsUrl: z.string().trim().url("Podaj poprawny adres URL.").optional().or(z.literal("").transform(() => undefined)),
    status: z.nativeEnum(TournamentStatus).default(TournamentStatus.DRAFT),
    registrationOpen: z.coerce.boolean().default(false),
    allowPlayerCancellation: z.coerce.boolean().default(false),
    showRegisteredPlayers: z.coerce.boolean().default(false),
    intent: z.enum(["draft", "publish", "save"]).default("save")
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Data zakończenia nie może być wcześniejsza niż start.",
    path: ["endDate"]
  });

export const tournamentStatusSchema = z.object({
  status: z.nativeEnum(TournamentStatus),
  registrationOpen: z.coerce.boolean().optional()
});
