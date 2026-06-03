import { notFound } from "next/navigation";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { StandingsTable } from "@/components/tournament-engine/standings-table";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import { recalculateStandings } from "@/lib/tournament-engine/standings";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function PublicStandingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  if (["IN_PROGRESS", "FINISHED"].includes(tournament.status)) {
    await recalculateStandings(tournament.id);
  }

  const standings = await prisma.tournamentStanding.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { rank: "asc" },
    include: { registration: true }
  });

  return (
    <PageShell title={`Tabela: ${tournament.title}`} description="Aktualna klasyfikacja i dogrywki.">
      <PublicTournamentNav slug={tournament.slug} active="tabela" />
      <StandingsTable standings={standings} playerHrefBase={`/turnieje/${tournament.slug}/zawodnicy`} />
    </PageShell>
  );
}
