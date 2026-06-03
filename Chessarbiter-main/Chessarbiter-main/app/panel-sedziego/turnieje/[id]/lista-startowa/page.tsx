import Link from "next/link";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { formatChessCategory } from "@/lib/constants/chess";

export const dynamic = "force-dynamic";

export default async function ManageStartingListPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: tournament.id, status: RegistrationStatus.REGISTERED },
    orderBy: [{ startNumber: "asc" }, { rating: "desc" }, { lastName: "asc" }, { firstName: "asc" }]
  });

  return (
    <PageShell title={`Lista startowa: ${tournament.title}`} description="Skupiony widok zawodników dopuszczonych do gry.">
      <TournamentManagementTabs tournamentId={tournament.id} active="lista-startowa" />
      <Card>
        <CardHeader>
          <CardTitle>Zawodnicy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Nr</th>
                  <th className="py-2 pr-3">Zawodnik</th>
                  <th className="py-2 pr-3">Klub / miasto</th>
                  <th className="py-2 pr-3">Rok urodzenia</th>
                  <th className="py-2 pr-3">Ranking</th>
                  <th className="py-2 pr-3">Kategoria</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration, index) => (
                  <tr key={registration.id} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">{registration.startNumber ?? index + 1}</td>
                    <td className="py-3 pr-3 font-medium">
                      <Link className="text-amber-700 hover:underline" href={`/turnieje/${tournament.slug}/zawodnicy/${registration.id}`}>
                        {registration.firstName} {registration.lastName}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{registration.clubOrCity}</td>
                    <td className="py-3 pr-3">{registration.birthYear ?? "Brak"}</td>
                    <td className="py-3 pr-3">{registration.rating}</td>
                    <td className="py-3 pr-3">{formatChessCategory(registration.chessCategory)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 ? <p className="py-4 text-slate-600">Brak aktywnych zawodników.</p> : null}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
