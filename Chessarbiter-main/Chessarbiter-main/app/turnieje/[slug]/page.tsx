import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationStatus } from "@prisma/client";
import { CalendarDays, FileText, Mail, MapPin, Phone, Users } from "lucide-react";
import { RegistrationForm } from "@/components/tournaments/registration-form";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  formatDateRange,
  isRegistrationAvailable,
  registrationStatusLabels,
  timeControlTypeLabels,
  tournamentStatusLabels,
  tournamentTypeLabels
} from "@/lib/constants/tournaments";
import { getRatingForTimeControl } from "@/lib/rating";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      _count: { select: { registrations: { where: { status: RegistrationStatus.REGISTERED } } } }
    }
  });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  const user = await getCurrentUser();
  const profile = user ? await prisma.playerProfile.findUnique({ where: { userId: user.id } }) : null;
  const ownRegistration = user
    ? await prisma.tournamentRegistration.findFirst({
        where: { tournamentId: tournament.id, userId: user.id },
        select: { id: true, status: true }
      })
    : null;
  const selectedRating = getRatingForTimeControl(profile, tournament.timeControlType);
  const registrationOpen = isRegistrationAvailable(tournament);
  const isManager = user?.role === "ADMIN" || user?.id === tournament.createdById;

  return (
    <PageShell title={tournament.title} description={tournament.description}>
      <PublicTournamentNav slug={tournament.slug} active="info" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacje o turnieju</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <Info icon={<MapPin className="h-4 w-4" />} label="Miejsce" value={`${tournament.city}, ${tournament.location}`} />
              <Info icon={<CalendarDays className="h-4 w-4" />} label="Data" value={formatDateRange(tournament.startDate, tournament.endDate)} />
              <Info label="System" value={tournamentTypeLabels[tournament.tournamentType]} />
              <Info label="Tempo" value={`${timeControlTypeLabels[tournament.timeControlType]} · ${tournament.timeControlDescription}`} />
              <Info label="Liczba rund" value={String(tournament.rounds)} />
              <Info label="Status" value={tournamentStatusLabels[tournament.status]} />
              <Info icon={<Users className="h-4 w-4" />} label="Zgłoszenia" value={`${tournament._count.registrations}${tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ""}`} />
              <Info label="Wpisowe" value={tournament.entryFee ?? "Brak informacji"} />
              <Info icon={<Mail className="h-4 w-4" />} label="Kontakt e-mail" value={tournament.contactEmail} />
              <Info icon={<Phone className="h-4 w-4" />} label="Telefon" value={tournament.contactPhone ?? "Brak"} />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            {tournament.regulationsUrl ? (
              <Button asChild variant="outline">
                <Link href={tournament.regulationsUrl}>
                  <FileText className="h-4 w-4" />
                  Regulamin
                </Link>
              </Button>
            ) : null}
            {isManager ? (
              <Button asChild variant="outline">
                <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`}>Zarządzaj turniejem</Link>
              </Button>
            ) : null}
          </div>

          {!user ? (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="text-sm text-slate-700">Zaloguj się, aby szybciej zapisywać się na turnieje. Rejestracja gościa nadal jest dostępna.</p>
                <Button asChild variant="outline">
                  <Link href="/logowanie">Zaloguj się</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status zapisów</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant={registrationOpen ? "success" : "muted"}>{registrationOpen ? "Zapisy otwarte" : "Zapisy zamknięte"}</Badge>
              {tournament.registrationDeadline ? (
                <p className="text-sm text-slate-600">Termin: {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(tournament.registrationDeadline)}</p>
              ) : null}
              {ownRegistration ? (
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  <p className="font-medium">Jesteś już zgłoszony.</p>
                  <p className="text-slate-600">Status: {registrationStatusLabels[ownRegistration.status]}</p>
                  <Button asChild className="mt-3 w-full" variant="outline">
                    <Link href="/moje-zgloszenia">Moje zgłoszenia</Link>
                  </Button>
                </div>
              ) : registrationOpen ? (
                <Button asChild className="w-full">
                  <a href="#zapisy">Zapisz się</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {registrationOpen && !ownRegistration ? (
            <RegistrationForm
              tournamentId={tournament.id}
              defaults={{
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                email: profile?.email ?? user?.email,
                clubOrCity: profile?.clubOrCity,
                federation: profile?.federation,
                licenseNumber: profile?.licenseNumber,
                rating: selectedRating,
                chessCategory: profile?.chessCategory,
                phoneNumber: profile?.phoneNumber,
                birthYear: profile?.birthYear
              }}
              ratingHint={selectedRating !== null && selectedRating !== undefined ? "Ranking został dobrany z profilu do tempa turnieju." : "Wpisz ranking ręcznie dla tego tempa gry."}
            />
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </p>
      <p className="font-medium text-slate-950">{value}</p>
    </div>
  );
}
