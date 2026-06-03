import Link from "next/link";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { CreateRoundButton, GenerateSwissRoundButton } from "@/components/tournament-engine/round-actions";
import { ManualPairingForm, ManualParticipantForm } from "@/components/tournament-engine/pairing-module-forms";
import { StandingsTable } from "@/components/tournament-engine/standings-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { formatChessCategory } from "@/lib/constants/chess";
import { roundStatusLabels } from "@/lib/constants/tournaments";
import { recalculateStandings } from "@/lib/tournament-engine/standings";

export const dynamic = "force-dynamic";

export default async function PairingModulePage({ params }: { params: Promise<{ tournamentId: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { tournamentId } = await params;
  const tournament = await requireTournamentManager(user, tournamentId);

  await recalculateStandings(tournament.id);
  const [participants, rounds, standings] = await Promise.all([
    prisma.tournamentRegistration.findMany({
      where: { tournamentId: tournament.id, status: RegistrationStatus.REGISTERED },
      orderBy: [{ startNumber: "asc" }, { rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
    }),
    prisma.round.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { roundNumber: "asc" },
      include: { games: { orderBy: { boardNumber: "asc" } } }
    }),
    prisma.tournamentStanding.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { rank: "asc" },
      include: { registration: true }
    })
  ]);
  const lastRound = rounds.at(-1);
  const nextRoundNumber = (lastRound?.roundNumber ?? 0) + (lastRound?.status === "COMPLETED" || !lastRound ? 1 : 0);

  return (
    <PageShell title={`Moduł kojarzeń: ${tournament.title}`} description="Prowadź uczestników, rundy, ręczne kojarzenia i tabelę bez mieszania z publiczną stroną turnieju.">
      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`}>Zgłoszenia</Link></Button>
        <Button asChild variant="outline"><Link href={`/panel-sedziego/turnieje/${tournament.id}/rundy`}>Rundy sędziowskie</Link></Button>
        <Button asChild variant="outline"><Link href={`/panel-sedziego/turnieje/${tournament.id}/tabela`}>Tabela</Link></Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uczestnicy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Domyślnie moduł korzysta z zawodników ze zgłoszeń ze statusem „zgłoszony”. Możesz też dodać osobę ręcznie.</p>
            <Button asChild variant="outline">
              <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`}>Pobierz zawodników ze zgłoszeń</Link>
            </Button>
            <ManualParticipantForm tournamentId={tournament.id} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Nr</th>
                    <th className="py-2 pr-3">Zawodnik</th>
                    <th className="py-2 pr-3">Klub / miasto</th>
                    <th className="py-2 pr-3">Ranking</th>
                    <th className="py-2 pr-3">Kategoria</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">{participant.startNumber ?? index + 1}</td>
                      <td className="py-3 pr-3 font-medium">{participant.firstName} {participant.lastName}</td>
                      <td className="py-3 pr-3">{participant.clubOrCity}</td>
                      <td className="py-3 pr-3">{participant.rating}</td>
                      <td className="py-3 pr-3">{formatChessCategory(participant.chessCategory)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rundy i generowanie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {tournament.tournamentType === "SWISS" ? <GenerateSwissRoundButton tournamentId={tournament.id} disabled={tournament.status !== "IN_PROGRESS" || (!!lastRound && lastRound.status !== "COMPLETED")} /> : null}
              {tournament.tournamentType !== "SWISS" && tournament.tournamentType !== "ROUND_ROBIN" ? <CreateRoundButton tournamentId={tournament.id} /> : null}
            </div>
            <div className="grid gap-2">
              {rounds.map((round) => (
                <Link key={round.id} href={`/panel-sedziego/turnieje/${tournament.id}/rundy/${round.roundNumber}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:bg-slate-50">
                  <span className="font-medium">Runda {round.roundNumber} · {round.games.length} partii</span>
                  <Badge variant={round.status === "COMPLETED" ? "success" : round.status === "IN_PROGRESS" ? "secondary" : "muted"}>{roundStatusLabels[round.status]}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dodaj kojarzenie ręcznie</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualPairingForm tournamentId={tournament.id} participants={participants} nextRoundNumber={nextRoundNumber || 1} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabela</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={standings} playerHrefBase={`/turnieje/${tournament.slug}/zawodnicy`} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
