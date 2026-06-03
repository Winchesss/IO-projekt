"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, RegistrationStatus, TournamentStatus } from "@prisma/client";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requireArbiterOrAdmin } from "@/lib/permissions";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { canTransitionTournamentStatus } from "@/lib/tournament-status";
import { canCancelPlayerRegistration, canCreateRegistration, getInitialRegistrationStatus } from "@/lib/registration";
import { registrationSchema, registrationStatusSchema } from "@/lib/validators/registration";
import { tournamentSchema, tournamentStatusSchema } from "@/lib/validators/tournament";
import { createUniqueTournamentSlug } from "@/lib/tournaments/slug";
import { formDataToValues, type FormValues } from "@/lib/forms";

export type FormState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: FormValues;
};

function normalizeCheckboxes(formData: FormData) {
  return {
    ...Object.fromEntries(formData),
    registrationOpen: formData.get("registrationOpen") === "on",
    allowPlayerCancellation: formData.get("allowPlayerCancellation") === "on",
    showRegisteredPlayers: formData.get("showRegisteredPlayers") === "on"
  };
}

export async function createTournamentAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArbiterOrAdmin();
  const values = formDataToValues(formData);
  const parsed = tournamentSchema.safeParse(normalizeCheckboxes(formData));

  if (!parsed.success) {
    return {
      error: "Popraw błędy w formularzu.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values
    };
  }

  const { intent, ...data } = parsed.data;
  const status = intent === "publish" ? TournamentStatus.PUBLISHED : TournamentStatus.DRAFT;
  const slug = await createUniqueTournamentSlug(data.title);

  const tournament = await prisma.tournament.create({
    data: {
      ...data,
      status,
      slug,
      createdById: user.id,
      registrationOpen: status === TournamentStatus.PUBLISHED ? data.registrationOpen : false
    },
    select: { id: true }
  });

  redirect(`/panel-sedziego/turnieje/${tournament.id}/edytuj`);
}

export async function updateTournamentAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArbiterOrAdmin();
  const values = formDataToValues(formData);
  const id = String(formData.get("id") ?? "");
  const tournament = await requireTournamentManager(user, id);
  const parsed = tournamentSchema.safeParse(normalizeCheckboxes(formData));

  if (!parsed.success) {
    return {
      error: "Popraw błędy w formularzu.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values
    };
  }

  const { intent, ...data } = parsed.data;
  const status =
    intent === "publish"
      ? TournamentStatus.PUBLISHED
      : intent === "draft"
        ? TournamentStatus.DRAFT
        : data.status;

  if (status !== tournament.status && !canTransitionTournamentStatus(tournament.status, status, user)) {
    return { error: "Ta zmiana statusu nie jest teraz dozwolona.", values };
  }

  const slug = await createUniqueTournamentSlug(data.title, tournament.id);

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      ...data,
      status,
      slug,
      registrationOpen: status === TournamentStatus.PUBLISHED ? data.registrationOpen : false
    }
  });

  revalidatePath("/panel-sedziego");
  revalidatePath(`/panel-sedziego/turnieje/${tournament.id}/edytuj`);
  revalidatePath(`/turnieje/${slug}`);
  return { success: "Turniej został zapisany." };
}

export async function changeTournamentStatusAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArbiterOrAdmin();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const parsed = tournamentStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Nieprawidłowa zmiana statusu." };
  }

  const tournament = await requireTournamentManager(user, tournamentId);

  if (!canTransitionTournamentStatus(tournament.status, parsed.data.status, user)) {
    return { error: "Ta zmiana statusu nie jest teraz dozwolona." };
  }

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      status: parsed.data.status,
      registrationOpen: parsed.data.status === TournamentStatus.PUBLISHED
    }
  });

  revalidatePath("/panel-sedziego");
  revalidatePath(`/panel-sedziego/turnieje/${tournament.id}/edytuj`);
  revalidatePath(`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`);
  revalidatePath(`/turnieje/${tournament.slug}`);
  return { success: "Status turnieju został zmieniony." };
}

export async function registerForTournamentAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = formDataToValues(formData);
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const user = await getCurrentUser();
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      _count: {
        select: {
          registrations: { where: { status: RegistrationStatus.REGISTERED } }
        }
      }
    }
  });

  if (!tournament) {
    return { error: "Nie znaleziono turnieju.", values };
  }

  if (!canCreateRegistration(tournament)) {
    return { error: "Zapisy na ten turniej są zamknięte.", values };
  }

  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Popraw błędy w formularzu.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values
    };
  }

  const duplicate = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId,
      OR: [{ email: parsed.data.email }, ...(user ? [{ userId: user.id }] : [])]
    },
    select: { id: true }
  });

  if (duplicate) {
    return { error: "Istnieje już zgłoszenie na ten turniej dla tego konta lub adresu e-mail.", values };
  }

  const status = getInitialRegistrationStatus(tournament, tournament._count.registrations);

  try {
    await prisma.tournamentRegistration.create({
      data: {
        ...parsed.data,
        tournamentId,
        userId: user?.id,
        status
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Istnieje już zgłoszenie na ten turniej dla tego konta lub adresu e-mail.", values };
    }

    throw error;
  }

  revalidatePath(`/turnieje/${tournament.slug}`);
  if (user) {
    revalidatePath("/moje-zgloszenia");
  }
  return { success: status === RegistrationStatus.WAITLIST ? "Dodano na listę rezerwową." : "Zgłoszenie zostało zapisane." };
}

export async function cancelOwnRegistrationAction(formData: FormData) {
  const user = await requireUser();
  const registrationId = String(formData.get("registrationId") ?? "");

  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: true }
  });

  if (!registration || registration.userId !== user.id) {
    redirect("/moje-zgloszenia");
  }

  if (canCancelPlayerRegistration(registration)) {
    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.CANCELLED }
    });
  }

  revalidatePath("/moje-zgloszenia");
  revalidatePath(`/turnieje/${registration.tournament.slug}`);
}

export async function manageRegistrationStatusAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArbiterOrAdmin();
  const parsed = registrationStatusSchema.safeParse(Object.fromEntries(formData));
  const tournamentId = String(formData.get("tournamentId") ?? "");

  if (!parsed.success) {
    return { error: "Nieprawidłowa zmiana statusu." };
  }

  await requireTournamentManager(user, tournamentId);

  const result = await prisma.tournamentRegistration.updateMany({
    where: { id: parsed.data.registrationId, tournamentId },
    data: { status: parsed.data.status }
  });

  if (result.count === 0) {
    return { error: "Nie znaleziono zgłoszenia w tym turnieju." };
  }

  revalidatePath(`/panel-sedziego/turnieje/${tournamentId}/zgloszenia`);
  return { success: "Status zgłoszenia został zmieniony." };
}

export async function deleteTournamentAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireArbiterOrAdmin();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const tournament = await requireTournamentManager(user, tournamentId);

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      deletedAt: new Date(),
      registrationOpen: false
    }
  });

  revalidatePath("/panel-sedziego");
  revalidatePath("/panel-admina/turnieje");
  revalidatePath("/turnieje");
  return { success: "Turniej został usunięty." };
}
