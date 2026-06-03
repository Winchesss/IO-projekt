import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatChessCategory } from "@/lib/constants/chess";
import { gameResultLabels, registrationStatusLabels } from "@/lib/constants/tournaments";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function PublicPlayerPage({ params }: { params: Promise<{ slug: string; registrationId: string }> }) {
  const { slug, registrationId } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  const user = await getCurrentUser();
  const canSeePrivate = user?.role === "ADMIN" || user?.id === tournament.createdById;
  const registration = await prisma.tournamentRegistration.findFirst({
    where: { id: registrationId, tournamentId: tournament.id },
    include: {
      standing: true,
      whiteGames: {
        include: { round: true, blackRegistration: true },
        orderBy: [{ round: { roundNumber: "asc" } }, { boardNumber: "asc" }]
      },
      blackGames: {
        include: { round: true, whiteRegistration: true },
        orderBy: [{ round: { roundNumber: "asc" } }, { boardNumber: "asc" }]
      }
    }
  });

  if (!registration) {
    notFound();
  }

  const games = [
    ...registration.whiteGames.map((game) => ({
      id: game.id,
      roundNumber: game.round.roundNumber,
      boardNumber: game.boardNumber,
      color: "Białe",
      opponent: game.blackRegistration,
      result: game.result,
      points: game.whitePoints
    })),
    ...registration.blackGames.map((game) => ({
      id: game.id,
      roundNumber: game.round.roundNumber,
      boardNumber: game.boardNumber,
      color: "Czarne",
      opponent: game.whiteRegistration,
      result: game.result,
      points: game.blackPoints
    }))
  ].sort((a, b) => a.roundNumber - b.roundNumber || a.boardNumber - b.boardNumber);

  return (
    <PageShell title={`${registration.firstName} ${registration.lastName}`} description={`Szczegóły zawodnika w turnieju ${tournament.title}.`}>
      <PublicTournamentNav slug={tournament.slug} active="lista-startowa" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dane zawodnika</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Imię" value={registration.firstName} />
            <Info label="Nazwisko" value={registration.lastName} />
            {canSeePrivate ? <Info label="E-mail" value={registration.email} /> : null}
            {canSeePrivate ? <Info label="Telefon" value={registration.phoneNumber ?? "Brak"} /> : null}
            <Info label="Klub / miasto" value={registration.clubOrCity} />
            <Info label="Federacja" value={registration.federation ?? "Brak"} />
            <Info label="Numer licencji" value={registration.licenseNumber ?? "Brak"} />
            <Info label="Ranking" value={String(registration.rating)} />
            <Info label="Kategoria" value={formatChessCategory(registration.chessCategory)} />
            <Info label="Rok urodzenia" value={registration.birthYear ? String(registration.birthYear) : "Brak"} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Status zgłoszenia</span>
              <Badge variant={registration.status === "REGISTERED" ? "success" : registration.status === "WAITLIST" ? "warning" : "muted"}>{registrationStatusLabels[registration.status]}</Badge>
            </div>
            <Info label="Numer startowy" value={registration.startNumber ? String(registration.startNumber) : "Brak"} />
            <Info label="Punkty" value={registration.standing ? formatPoints(registration.standing.points) : "0"} />
            <Info label="Miejsce" value={registration.standing?.rank ? String(registration.standing.rank) : "Brak"} />
            {canSeePrivate ? <Info label="Uwagi" value={registration.notes?.trim() || "Brak uwag"} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historia partii</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Runda</th>
                    <th className="py-2 pr-3">Szach.</th>
                    <th className="py-2 pr-3">Kolor</th>
                    <th className="py-2 pr-3">Przeciwnik</th>
                    <th className="py-2 pr-3">Ranking</th>
                    <th className="py-2 pr-3">Wynik</th>
                    <th className="py-2 pr-3">Punkty</th>
                    <th className="py-2 pr-3">Szczegóły</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">{game.roundNumber}</td>
                      <td className="py-3 pr-3">{game.boardNumber}</td>
                      <td className="py-3 pr-3">{game.color}</td>
                      <td className="py-3 pr-3">{game.opponent ? `${game.opponent.firstName} ${game.opponent.lastName}` : "Pauza"}</td>
                      <td className="py-3 pr-3">{game.opponent?.rating ?? "-"}</td>
                      <td className="py-3 pr-3">{gameResultLabels[game.result]}</td>
                      <td className="py-3 pr-3">{formatPoints(game.points)}</td>
                      <td className="py-3 pr-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/turnieje/${tournament.slug}/rundy/${game.roundNumber}`}>Runda</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {games.length === 0 ? <p className="py-4 text-slate-600">Brak rozegranych partii w tym turnieju.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
