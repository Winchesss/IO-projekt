"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { roleChangeSchema } from "@/lib/validators/admin";

export type AdminActionState = {
  success?: string;
  error?: string;
};

export async function changeUserRoleAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = roleChangeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowa zmiana roli." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true }
  });

  if (!target) {
    return { error: "Nie znaleziono użytkownika." };
  }

  if (target.role === UserRole.ADMIN) {
    return { error: "Roli administratora nie można zmieniać z poziomu panelu." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role }
  });

  revalidatePath("/panel-admina/uzytkownicy");
  return { success: "Rola użytkownika została zmieniona." };
}

export async function deleteUserAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tournaments: { select: { id: true }, where: { deletedAt: null }, take: 1 } }
  });

  if (!target) {
    return { error: "Nie znaleziono użytkownika." };
  }
  if (target.role === UserRole.ADMIN) {
    const admins = await prisma.user.count({ where: { role: UserRole.ADMIN, deletedAt: null } });
    if (admins <= 1) {
      return { error: "Nie można usunąć jedynego konta administratora." };
    }
  }
  if (target.tournaments.length > 0) {
    return { error: "Ten użytkownik prowadzi turnieje. Najpierw przekaż je innemu sędziemu albo usuń turnieje." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      deletedAt: new Date(),
      email: `usuniety-${target.id}@deleted.local`,
      name: "Usunięty użytkownik",
      passwordHash: ""
    }
  });

  revalidatePath("/panel-admina/uzytkownicy");
  return { success: "Konto użytkownika zostało usunięte." };
}
