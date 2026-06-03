import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Download } from "lucide-react";
import { RecalculateStandingsButton } from "@/components/tournament-engine/standings-actions";
import { StandingsTable } from "@/components/tournament-engine/standings-table";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { recalculateStandings } from "@/lib/tournament-engine/standings";

export const dynamic = "force-dynamic";

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  await recalculateStandings(tournament.id);
  const standings = await prisma.tournamentStanding.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { rank: "asc" },
    include: { registration: true }
  });

  return (
    <PageShell title={`Tabela: ${tournament.title}`} description="Tabela z punktami, bilansem i dogrywkami. BYE nie jest liczony jako realny przeciwnik w Buchholzu i Sonneborn-Bergerze.">
      <TournamentManagementTabs tournamentId={tournament.id} active="tabela" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dogrywki</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-slate-600">
          <RecalculateStandingsButton tournamentId={tournament.id} />
          <Button asChild>
            <Link href={`/panel-sedziego/turnieje/${tournament.id}/tabela/export`}>
              <Download className="h-4 w-4" />
              Eksport CSV
            </Link>
          </Button>
        </CardContent>
      </Card>
      <StandingsTable standings={standings} playerHrefBase={`/turnieje/${tournament.slug}/zawodnicy`} />
    </PageShell>
  );
}
