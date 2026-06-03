import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalInt = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number({ invalid_type_error: "Podaj liczbę." }).int("Podaj liczbę całkowitą.").optional()
);

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1, "Podaj imię.").max(80),
  lastName: z.string().trim().min(1, "Podaj nazwisko.").max(80),
  email: z.string().trim().email("Podaj poprawny e-mail.").toLowerCase(),
  clubOrCity: z.string().trim().min(1, "Podaj klub lub miasto.").max(120),
  federation: optionalText,
  licenseNumber: optionalText,
  rating: z.coerce.number().int("Podaj liczbę całkowitą.").min(0, "Ranking nie może być ujemny.").max(4000, "Podaj poprawny ranking."),
  chessCategory: z.string().trim().max(30, "Kategoria może mieć maksymalnie 30 znaków.").optional().transform((value) => value || "NONE"),
  phoneNumber: optionalText,
  birthYear: optionalInt.refine(
    (value) => value === undefined || (value >= 1900 && value <= new Date().getFullYear()),
    "Podaj poprawny rok urodzenia."
  ),
  notes: optionalText
});

export const registrationStatusSchema = z.object({
  registrationId: z.string().min(1),
  status: z.nativeEnum(RegistrationStatus)
});
