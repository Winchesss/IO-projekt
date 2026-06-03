import { notFound } from "next/navigation";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { RoundsTable } from "@/components/tournament-engine/rounds-table";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function PublicRoundPage({ params }: { params: Promise<{ slug: string; roundNumber: string }> }) {
  const { slug, roundNumber } = await params;
  const number = Number(roundNumber);
  if (!Number.isInteger(number) || number < 1) {
    notFound();
  }

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentRounds: {
        where: { roundNumber: number },
        include: {
          games: {
            orderBy: { boardNumber: "asc" },
            include: { whiteRegistration: true, blackRegistration: true }
          }
        }
      }
    }
  });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status) || tournament.tournamentRounds.length === 0) {
    notFound();
  }

  return (
    <PageShell title={`Runda ${number}: ${tournament.title}`} description="Kojarzenia i wyniki jednej rundy.">
      <PublicTournamentNav slug={tournament.slug} active="rundy" />
      <RoundsTable tournamentId={tournament.id} rounds={tournament.tournamentRounds} editable={false} playerHrefBase={`/turnieje/${tournament.slug}/zawodnicy`} />
    </PageShell>
  );
}
