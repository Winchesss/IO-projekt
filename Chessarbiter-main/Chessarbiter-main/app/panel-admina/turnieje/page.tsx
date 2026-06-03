import Link from "next/link";
import { Prisma, UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { formatDateRange, tournamentStatusLabels, tournamentTypeLabels } from "@/lib/constants/tournaments";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const type = typeof params.type === "string" ? params.type : "";
  const owner = typeof params.owner === "string" ? params.owner : "";

  const where: Prisma.TournamentWhereInput = {
    deletedAt: null,
    ...(status ? { status: status as never } : {}),
    ...(type ? { tournamentType: type as never } : {}),
    ...(owner ? { createdById: owner } : {})
  };

  const [tournaments, owners] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { registrations: true, tournamentRounds: true, games: true, standings: true } }
      }
    }),
    prisma.user.findMany({
      where: { role: { in: [UserRole.ARBITER, UserRole.ADMIN] }, deletedAt: null },
      select: { id: true, email: true, name: true },
      orderBy: { email: "asc" }
    })
  ]);

  return (
    <PageShell title="Wszystkie turnieje" description="Administrator może edytować i zarządzać każdym turniejem.">
      <Card>
        <CardHeader>
          <CardTitle>Turnieje</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-wrap gap-3">
            <select name="status" defaultValue={status} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Każdy status</option>
              {Object.entries(tournamentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select name="type" defaultValue={type} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Każdy system</option>
              <option value="SWISS">System szwajcarski</option>
              <option value="ROUND_ROBIN">System kołowy</option>
            </select>
            <select name="owner" defaultValue={owner} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Każdy prowadzący</option>
              {owners.map((arbiter) => (
                <option key={arbiter.id} value={arbiter.id}>{arbiter.name ?? arbiter.email}</option>
              ))}
            </select>
            <Button>Filtruj</Button>
          </form>
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{tournament.title}</p>
                  <p className="text-sm text-slate-600">
                    {tournament.city} · {formatDateRange(tournament.startDate, tournament.endDate)} · {tournamentTypeLabels[tournament.tournamentType]} · {tournament.createdBy.name ?? tournament.createdBy.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{tournamentStatusLabels[tournament.status]}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia`}>Zgłoszenia</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/panel-sedziego/turnieje/${tournament.id}/edytuj`}>Edytuj</Link>
                  </Button>
                  <DeleteTournamentButton
                    tournamentId={tournament.id}
                    hasData={Boolean(tournament._count.registrations || tournament._count.tournamentRounds || tournament._count.games || tournament._count.standings)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
