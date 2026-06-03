import { z } from "zod";
import { chessCategoryLabels } from "@/lib/constants/chess";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalInt = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number({ invalid_type_error: "Podaj liczbę." }).int("Podaj liczbę całkowitą.").optional()
);

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Podaj imię.").max(80),
  lastName: z.string().trim().min(1, "Podaj nazwisko.").max(80),
  email: z.string().trim().email("Podaj poprawny adres e-mail.").toLowerCase(),
  clubOrCity: z.string().trim().min(1, "Podaj klub lub miasto.").max(120),
  federation: optionalText,
  licenseNumber: optionalText,
  classicalRating: optionalInt.refine((value) => value === undefined || (value >= 0 && value <= 4000), "Podaj poprawny ranking."),
  rapidRating: optionalInt.refine((value) => value === undefined || (value >= 0 && value <= 4000), "Podaj poprawny ranking."),
  blitzRating: optionalInt.refine((value) => value === undefined || (value >= 0 && value <= 4000), "Podaj poprawny ranking."),
  chessCategory: z.string().trim().max(30, "Kategoria może mieć maksymalnie 30 znaków.").optional().transform((value) => value || "NONE"),
  phoneNumber: optionalText,
  birthYear: optionalInt.refine(
    (value) => value === undefined || (value >= 1900 && value <= new Date().getFullYear()),
    "Podaj poprawny rok urodzenia."
  )
});

export { chessCategoryLabels };
