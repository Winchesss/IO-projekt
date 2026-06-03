import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import { roundStatusLabels } from "@/lib/constants/tournaments";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function PublicRoundsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentRounds: {
        orderBy: { roundNumber: "asc" },
        include: { _count: { select: { games: true } } }
      }
    }
  });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  return (
    <PageShell title={`Rundy: ${tournament.title}`} description="Lista rund. Każda runda ma osobny, czytelny widok.">
      <PublicTournamentNav slug={tournament.slug} active="rundy" />
      <Card>
        <CardHeader>
          <CardTitle>Rundy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {tournament.tournamentRounds.map((round) => (
            <Link key={round.id} href={`/turnieje/${tournament.slug}/rundy/${round.roundNumber}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition hover:bg-slate-50">
              <div>
                <p className="font-semibold">Runda {round.roundNumber}</p>
                <p className="text-sm text-slate-600">{round._count.games} partii</p>
              </div>
              <Badge variant={round.status === "COMPLETED" ? "success" : round.status === "IN_PROGRESS" ? "secondary" : "muted"}>
                {roundStatusLabels[round.status]}
              </Badge>
            </Link>
          ))}
          {tournament.tournamentRounds.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-slate-600">Rundy nie zostały jeszcze opublikowane.</p> : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
