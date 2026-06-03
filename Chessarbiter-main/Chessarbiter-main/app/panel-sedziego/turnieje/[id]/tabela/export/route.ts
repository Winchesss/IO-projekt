import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { toCsv } from "@/lib/csv";
import { formatChessCategory } from "@/lib/constants/chess";
import { recalculateStandings } from "@/lib/tournament-engine/standings";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  await recalculateStandings(tournament.id);
  const standings = await prisma.tournamentStanding.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { rank: "asc" },
    include: { registration: true }
  });

  const csv = toCsv(standings, [
    { header: "Miejsce", value: (row) => row.rank },
    { header: "Imię", value: (row) => row.registration.firstName },
    { header: "Nazwisko", value: (row) => row.registration.lastName },
    { header: "Klub / miasto", value: (row) => row.registration.clubOrCity },
    { header: "Rok urodzenia", value: (row) => row.registration.birthYear },
    { header: "Ranking", value: (row) => row.registration.rating },
    { header: "Kategoria", value: (row) => formatChessCategory(row.registration.chessCategory) },
    { header: "Punkty", value: (row) => row.points },
    { header: "Buchholz", value: (row) => row.buchholz },
    { header: "Median Buchholz", value: (row) => row.medianBuchholz },
    { header: "Sonneborn-Berger", value: (row) => row.sonnebornBerger },
    { header: "Progres", value: (row) => row.progressiveScore }
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tabela-${tournament.slug}.csv"`
    }
  });
}
