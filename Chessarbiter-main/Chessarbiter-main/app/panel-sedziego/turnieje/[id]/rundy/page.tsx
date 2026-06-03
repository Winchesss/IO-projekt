import { UserRole } from "@prisma/client";
import { CreateRoundButton, FinishTournamentButton, FinishTournamentEarlyButton, GenerateSwissRoundButton } from "@/components/tournament-engine/round-actions";
import { StartTournamentButton } from "@/components/tournament-engine/start-tournament-button";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { roundStatusLabels } from "@/lib/constants/tournaments";

export const dynamic = "force-dynamic";

export default async function RoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  const rounds = await prisma.round.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { roundNumber: "asc" },
    include: {
      games: {
        orderBy: { boardNumber: "asc" },
        include: {
          whiteRegistration: true,
          blackRegistration: true
        }
      }
    }
  });
  const allRoundsCompleted = rounds.length > 0 && rounds.every((round) => round.status === "COMPLETED");
  const lastRound = rounds.at(-1);
  const canGenerateSwissRound =
    tournament.tournamentType === "SWISS" &&
    tournament.status === "IN_PROGRESS" &&
    !!lastRound &&
    lastRound.status === "COMPLETED" &&
    rounds.length < tournament.rounds;
  const canFinishTournament =
    allRoundsCompleted && (tournament.tournamentType !== "SWISS" || rounds.length >= tournament.rounds);
  const canFinishEarly = tournament.status === "IN_PROGRESS" && rounds.some((round) => round.status === "COMPLETED");

  return (
    <PageShell title={`Rundy: ${tournament.title}`} description="Turniej kołowy generuje wszystkie rundy przy starcie. Swiss generuje kolejną rundę po zakończeniu poprzedniej.">
      <TournamentManagementTabs tournamentId={tournament.id} active="rundy" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cykl turnieju</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {["PUBLISHED", "REGISTRATION_CLOSED"].includes(tournament.status) ? <StartTournamentButton tournamentId={tournament.id} /> : null}
            {tournament.tournamentType !== "ROUND_ROBIN" && tournament.tournamentType !== "SWISS" ? <CreateRoundButton tournamentId={tournament.id} /> : null}
            {tournament.tournamentType === "SWISS" && tournament.status === "IN_PROGRESS" ? (
              <GenerateSwissRoundButton tournamentId={tournament.id} disabled={!canGenerateSwissRound} />
            ) : null}
            {tournament.status === "IN_PROGRESS" ? <FinishTournamentButton tournamentId={tournament.id} disabled={!canFinishTournament} /> : null}
            {tournament.status === "IN_PROGRESS" ? <FinishTournamentEarlyButton tournamentId={tournament.id} disabled={!canFinishEarly} /> : null}
          </div>
          {tournament.tournamentType === "SWISS" ? (
            <p className="text-sm text-amber-700">
              Silnik Swiss MVP unika powtórzeń, dobiera grupy punktowe i kolory deterministycznie, ale nie jest pełną implementacją FIDE Dutch Swiss.
            </p>
          ) : null}
          {rounds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {rounds.map((round) => (
                <Button key={round.id} asChild size="sm" variant="outline">
                  <Link href={`/panel-sedziego/turnieje/${tournament.id}/rundy/${round.roundNumber}`}>Runda {round.roundNumber}</Link>
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lista rund</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {rounds.map((round) => (
            <Link key={round.id} href={`/panel-sedziego/turnieje/${tournament.id}/rundy/${round.roundNumber}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition hover:bg-slate-50">
              <div>
                <p className="font-semibold">Runda {round.roundNumber}</p>
                <p className="text-sm text-slate-600">{round.games.length} partii</p>
              </div>
              <Badge variant={round.status === "COMPLETED" ? "success" : round.status === "IN_PROGRESS" ? "secondary" : "muted"}>
                {roundStatusLabels[round.status]}
              </Badge>
            </Link>
          ))}
          {rounds.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-slate-600">Nie utworzono jeszcze rund.</p> : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
