import Link from "next/link";
import { RegistrationStatus } from "@prisma/client";
import { CalendarDays, ShieldCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { formatDateRange, isRegistrationAvailable, timeControlTypeLabels } from "@/lib/constants/tournaments";
import { getUpcomingPublicTournamentWhereClause } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latestTournaments = await prisma.tournament.findMany({
    where: getUpcomingPublicTournamentWhereClause(),
    orderBy: { startDate: "asc" },
    take: 3,
    include: {
      _count: {
        select: {
          registrations: { where: { status: RegistrationStatus.REGISTERED } }
        }
      }
    }
  });

  return (
    <main>
      <section className="chess-board-bg bg-slate-950 text-white">
        <div className="mx-auto grid min-h-[520px] max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-300">Polskie turnieje szachowe</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal sm:text-6xl">ChessArbiter Polska</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Platforma do publikacji turniejów, zgłoszeń zawodników oraz pracy sędziów i administratora.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-amber-400 text-slate-950 hover:bg-amber-300">
                <Link href="/turnieje">Zobacz turnieje</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/rejestracja">Utwórz konto</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/logowanie">Zaloguj się</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <FeatureCard icon={<Trophy className="h-5 w-5" />} title="Zawodnicy" text="Publiczne zapisy, profil gracza i historia zgłoszeń." />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Sędziowie" text="Tworzenie turniejów i zarządzanie listą zgłoszonych." />
            <FeatureCard icon={<CalendarDays className="h-5 w-5" />} title="Turnieje" text="Szybkie filtrowanie wydarzeń według miasta, systemu i tempa gry." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Najbliższe wydarzenia</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">Najnowsze turnieje</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/turnieje">Wszystkie turnieje</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {latestTournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader>
                <div className="mb-3">
                  <Badge variant={isRegistrationAvailable(tournament) ? "success" : "muted"}>
                    {isRegistrationAvailable(tournament) ? "Zapisy otwarte" : "Zapisy zamknięte"}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{tournament.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>{tournament.city}, {tournament.location}</p>
                <p>{formatDateRange(tournament.startDate, tournament.endDate)}</p>
                <p>{timeControlTypeLabels[tournament.timeControlType]} · {tournament._count.registrations} zgłoszeń</p>
                <Button asChild className="w-full">
                  <Link href={`/turnieje/${tournament.slug}`}>Szczegóły</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {latestTournaments.length === 0 ? (
            <Card className="md:col-span-3">
              <CardContent className="p-6 text-slate-600">Nie ma jeszcze opublikowanych nadchodzących turniejów.</CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="border-white/10 bg-white/10 text-white shadow-xl backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-400 text-slate-950">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-slate-200">{text}</CardContent>
    </Card>
  );
}
