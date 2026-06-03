"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { formDataToValues, type FormValues } from "@/lib/forms";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: FormValues;
};

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = formDataToValues(formData);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Popraw błędy w formularzu.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });

  if (existingUser) {
    return { error: "Konto z tym adresem e-mail już istnieje.", values };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: UserRole.PLAYER
    },
    select: { id: true }
  });

  await createSession(user.id);
  redirect("/profil");
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = formDataToValues(formData);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Popraw błędy w formularzu.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true, deletedAt: true }
  });

  if (!user || user.deletedAt || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Nieprawidłowy e-mail lub hasło.", values };
  }

  await createSession(user.id);
  redirect("/profil");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
