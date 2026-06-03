import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { toCsv } from "@/lib/csv";
import { formatChessCategory } from "@/lib/constants/chess";
import { registrationStatusLabels } from "@/lib/enum-labels";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }]
  });

  const csv = toCsv(registrations, [
    { header: "Imię", value: (row) => row.firstName },
    { header: "Nazwisko", value: (row) => row.lastName },
    { header: "Email", value: (row) => row.email },
    { header: "Klub / miasto", value: (row) => row.clubOrCity },
    { header: "Federacja", value: (row) => row.federation },
    { header: "Numer licencji", value: (row) => row.licenseNumber },
    { header: "Ranking", value: (row) => row.rating },
    { header: "Kategoria", value: (row) => formatChessCategory(row.chessCategory) },
    { header: "Rok urodzenia", value: (row) => row.birthYear },
    { header: "Telefon", value: (row) => row.phoneNumber },
    { header: "Uwagi", value: (row) => row.notes?.trim() || "Brak uwag" },
    { header: "Status", value: (row) => registrationStatusLabels[row.status] },
    { header: "Data zgłoszenia", value: (row) => row.createdAt }
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zgloszenia-${tournament.slug}.csv"`
    }
  });
}
