import Link from "next/link";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { CalendarPlus, ClipboardList, Download, Trophy } from "lucide-react";
import { StartTournamentButton } from "@/components/tournament-engine/start-tournament-button";
import { TournamentStatusActions } from "@/components/tournaments/status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateRange, tournamentStatusLabels } from "@/lib/constants/tournaments";
import { getAllowedTournamentTransitions } from "@/lib/tournament-status";

export const dynamic = "force-dynamic";

export default async function ArbiterPanelPage() {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const tournamentWhere = user.role === UserRole.ADMIN ? { deletedAt: null } : { createdById: user.id, deletedAt: null };

  const [tournaments, activeRegistrations, upcomingCount] = await Promise.all([
    prisma.tournament.findMany({
      where: tournamentWhere,
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } }
        }
      }
    }),
    prisma.tournamentRegistration.count({
      where: {
        status: RegistrationStatus.REGISTERED,
        tournament: tournamentWhere
      }
    }),
    prisma.tournament.count({
      where: {
        ...tournamentWhere,
        startDate: { gte: new Date() }
      }
    })
  ]);

  return (
    <PageShell title="Panel sędziego" description={user.role === "ADMIN" ? "Administrator widzi wszystkie turnieje." : "Zarządzaj swoimi turniejami i zgłoszeniami."}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/panel-sedziego/turnieje/nowy">
            <CalendarPlus className="h-4 w-4" />
            Dodaj turniej
          </Link>
        </Button>
        {user.role === "ADMIN" ? (
          <Button asChild variant="outline">
            <Link href="/panel-admina">Panel administratora</Link>
          </Button>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="Moje turnieje" value={tournaments.length} icon={<Trophy className="h-5 w-5" />} />
        <SummaryCard title="Aktywne zgłoszenia" value={activeRegistrations} icon={<ClipboardList className="h-5 w-5" />} />
        <SummaryCard title="Nadchodzące turnieje" value={upcomingCount} icon={<CalendarPlus className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turnieje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="grid gap-4 rounded-lg border p-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{tournament.title}</p>
                  <Badge variant="secondary">{tournamentStatusLabels[tournament.status]}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {tournament.city} · {formatDateRange(tournament.startDate, tournament.endDate)} · {tournament._count.registrations} aktywnych zgłoszeń
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TournamentStatusActions tournamentId={tournament.id} actions={getAllowedTournamentTransitions(tournament.status, user)} />
                {["PUBLISHED", "REGISTRATION_CLOSED"].includes(tournament.status) ? <StartTournamentButton tournamentId={tournament.id} /> : null}
                <Button asChild size="sm" variant="outline">
                  <Link href={`/panel-sedziego/turnieje/${tournament.id}/edytuj`}>Edytuj</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`}>Zgłoszenia</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia/export`}>
                    <Download className="h-4 w-4" />
                    CSV
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {tournaments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-slate-600">
              <p className="font-medium text-slate-950">Nie masz jeszcze turniejów.</p>
              <p className="mt-1 text-sm">Dodaj pierwszy turniej, zapisz szkic albo opublikuj go od razu.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-100 text-amber-700">{icon}</span>
      </CardContent>
    </Card>
  );
}
