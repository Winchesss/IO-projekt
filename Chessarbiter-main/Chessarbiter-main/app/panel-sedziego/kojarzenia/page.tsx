import Link from "next/link";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateRange, tournamentStatusLabels } from "@/lib/constants/tournaments";

export const dynamic = "force-dynamic";

export default async function PairingDashboardPage() {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const where = user.role === "ADMIN" ? { deletedAt: null } : { createdById: user.id, deletedAt: null };
  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: [{ startDate: "desc" }],
    include: { _count: { select: { registrations: { where: { status: RegistrationStatus.REGISTERED } }, tournamentRounds: true } } }
  });

  return (
    <PageShell title="Moduł kojarzeń" description="Oddzielne miejsce do prowadzenia rund, ręcznych uczestników i wyników.">
      <div className="grid gap-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{tournament.title}</CardTitle>
                  <p className="mt-2 text-sm text-slate-600">{tournament.city} · {formatDateRange(tournament.startDate, tournament.endDate)}</p>
                </div>
                <Badge variant="secondary">{tournamentStatusLabels[tournament.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{tournament._count.registrations} zawodników · {tournament._count.tournamentRounds} rund</p>
              <Button asChild>
                <Link href={`/panel-sedziego/kojarzenia/${tournament.id}`}>Otwórz moduł</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {tournaments.length === 0 ? <p className="rounded-lg border bg-white p-6 text-slate-600">Brak turniejów do prowadzenia.</p> : null}
      </div>
    </PageShell>
  );
}
