import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail.").toLowerCase(),
  name: z.string().trim().max(120, "Imię i nazwisko jest za długie.").optional(),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być takie same.",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail.").toLowerCase(),
  password: z.string().min(1, "Podaj hasło.")
});
