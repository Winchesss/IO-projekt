import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationStatus } from "@prisma/client";
import { PublicTournamentNav } from "@/components/tournaments/public-tournament-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db/prisma";
import { formatChessCategory } from "@/lib/constants/chess";
import { registrationStatusLabels } from "@/lib/constants/tournaments";
import { isTournamentPublic } from "@/lib/tournaments/public";

export const dynamic = "force-dynamic";

export default async function StartingListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      registrations: {
        where: { status: { not: RegistrationStatus.CANCELLED } },
        orderBy: [{ startNumber: "asc" }, { rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
      }
    }
  });

  if (!tournament || tournament.deletedAt || !isTournamentPublic(tournament.status)) {
    notFound();
  }

  return (
    <PageShell title={`Lista startowa: ${tournament.title}`} description="Zawodnicy zgłoszeni do turnieju.">
      <PublicTournamentNav slug={tournament.slug} active="lista-startowa" />
      <Card>
        <CardHeader>
          <CardTitle>Lista startowa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Nr</th>
                  <th className="py-2 pr-3">Zawodnik</th>
                  <th className="py-2 pr-3">Klub / miasto</th>
                  <th className="py-2 pr-3">Rok urodzenia</th>
                  <th className="py-2 pr-3">Federacja</th>
                  <th className="py-2 pr-3">Ranking</th>
                  <th className="py-2 pr-3">Kategoria</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {tournament.registrations.map((registration, index) => (
                  <tr key={registration.id} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">{registration.startNumber ?? index + 1}</td>
                    <td className="py-3 pr-3 font-medium">
                      <Link className="text-amber-700 hover:underline" href={`/turnieje/${tournament.slug}/zawodnicy/${registration.id}`}>
                        {registration.firstName} {registration.lastName}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{registration.clubOrCity}</td>
                    <td className="py-3 pr-3">{registration.birthYear ?? "Brak"}</td>
                    <td className="py-3 pr-3">{registration.federation ?? "Brak"}</td>
                    <td className="py-3 pr-3">{registration.rating}</td>
                    <td className="py-3 pr-3">{formatChessCategory(registration.chessCategory)}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={registration.status === "REGISTERED" ? "success" : "warning"}>{registrationStatusLabels[registration.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tournament.registrations.length === 0 ? <p className="py-4 text-slate-600">Brak zgłoszeń.</p> : null}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
