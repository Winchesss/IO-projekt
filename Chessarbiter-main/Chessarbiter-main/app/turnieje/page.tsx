import Link from "next/link";
import { RegistrationStatus } from "@prisma/client";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import {
  formatDateRange,
  isRegistrationAvailable,
  timeControlTypeLabels,
  tournamentStatusLabels,
  tournamentTypeLabels
} from "@/lib/constants/tournaments";
import { getPublicTournamentWhereClause } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function TournamentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const type = typeof params.type === "string" ? params.type : "";
  const time = typeof params.time === "string" ? params.time : "";
  const where = getPublicTournamentWhereClause({ query, filter, type, time });

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          registrations: { where: { status: RegistrationStatus.REGISTERED } }
        }
      }
    }
  });

  return (
    <PageShell title="Turnieje" description="Znajdź turniej i zapisz się jako zawodnik.">
      <form className="mb-6 grid gap-3 rounded-lg border bg-white p-4 lg:grid-cols-[1fr_180px_180px_180px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" name="q" placeholder="Szukaj po nazwie, mieście lub miejscu" defaultValue={query} />
        </div>
        <select name="filter" defaultValue={filter} className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="all">Wszystkie publiczne</option>
          <option value="upcoming">Nadchodzące</option>
          <option value="registration">Zapisy otwarte</option>
          <option value="in-progress">W trakcie</option>
          <option value="finished">Zakończone</option>
          <option value="cancelled">Odwołane</option>
        </select>
        <select name="type" defaultValue={type} className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="">Każdy system</option>
          <option value="SWISS">System szwajcarski</option>
          <option value="ROUND_ROBIN">System kołowy</option>
        </select>
        <select name="time" defaultValue={time} className="rounded-md border bg-white px-3 py-2 text-sm">
          <option value="">Każde tempo</option>
          <option value="CLASSICAL">Klasyczne</option>
          <option value="RAPID">Szybkie</option>
          <option value="BLITZ">Błyskawiczne</option>
        </select>
        <Button>Filtruj</Button>
      </form>

      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{tournament.title}</CardTitle>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {tournament.city}, {tournament.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{tournamentStatusLabels[tournament.status]}</Badge>
                  <Badge variant={isRegistrationAvailable(tournament) ? "success" : "muted"}>
                    {isRegistrationAvailable(tournament) ? "Zapisy otwarte" : "Zapisy zamknięte"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </span>
                <span>{tournamentTypeLabels[tournament.tournamentType]}</span>
                <span>{timeControlTypeLabels[tournament.timeControlType]}</span>
                <span>
                  {tournament._count.registrations}
                  {tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ""} aktywnych zgłoszeń
                </span>
              </div>
              <Button asChild>
                <Link href={`/turnieje/${tournament.slug}`}>Szczegóły</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {tournaments.length === 0 ? <p className="rounded-lg border bg-white p-6 text-slate-600">Brak turniejów spełniających kryteria.</p> : null}
      </div>
    </PageShell>
  );
}
