import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import { recalculateStandings } from "@/lib/tournament-engine/standings";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function PublicResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentRounds: { orderBy: { roundNumber: "asc" } },
      standings: { orderBy: { rank: "asc" }, take: 5, include: { registration: true } }
    }
  });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  if (["IN_PROGRESS", "FINISHED"].includes(tournament.status)) {
    await recalculateStandings(tournament.id);
    tournament.standings = await prisma.tournamentStanding.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { rank: "asc" },
      take: 5,
      include: { registration: true }
    });
  }

  const latestRound = [...tournament.tournamentRounds].reverse().find((round) => round.status !== "NOT_STARTED") ?? tournament.tournamentRounds.at(-1);

  return (
    <PageShell title={`Wyniki: ${tournament.title}`} description="Szybki podgląd wyników i klasyfikacji.">
      <PublicTournamentNav slug={tournament.slug} active="wyniki" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnia runda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRound ? (
              <>
                <p className="text-sm text-slate-600">Najnowsze opublikowane kojarzenia i wyniki znajdziesz w widoku rundy.</p>
                <Button asChild>
                  <Link href={`/turnieje/${tournament.slug}/rundy/${latestRound.roundNumber}`}>Otwórz rundę {latestRound.roundNumber}</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-600">Rundy nie zostały jeszcze opublikowane.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Czołówka tabeli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tournament.standings.map((standing) => (
              <Link key={standing.id} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-slate-50" href={`/turnieje/${tournament.slug}/zawodnicy/${standing.registration.id}`}>
                <span>{standing.rank}. {standing.registration.firstName} {standing.registration.lastName}</span>
                <strong>{formatPoints(standing.points)} pkt</strong>
              </Link>
            ))}
            {tournament.standings.length === 0 ? <p className="text-sm text-slate-600">Tabela nie została jeszcze utworzona.</p> : null}
            <Button asChild variant="outline">
              <Link href={`/turnieje/${tournament.slug}/tabela`}>Pełna tabela</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
