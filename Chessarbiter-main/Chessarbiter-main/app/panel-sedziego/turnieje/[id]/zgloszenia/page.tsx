import Link from "next/link";
import { RegistrationStatus, UserRole } from "@prisma/client";
import { Download } from "lucide-react";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { RegistrationManagementActions } from "@/components/tournaments/registration-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";
import { formatChessCategory } from "@/lib/constants/chess";
import { registrationStatusLabels } from "@/lib/constants/tournaments";

export const dynamic = "force-dynamic";

export default async function ManageRegistrationsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const queryParams = await searchParams;
  const q = typeof queryParams.q === "string" ? queryParams.q.trim() : "";
  const status = typeof queryParams.status === "string" ? queryParams.status : "";
  const tournament = await requireTournamentManager(user, id);

  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      tournamentId: tournament.id,
      ...(status ? { status: status as RegistrationStatus } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { clubOrCity: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }]
  });

  return (
    <PageShell title={`Zgłoszenia: ${tournament.title}`} description="Zarządzaj listą startową i rezerwową.">
      <TournamentManagementTabs tournamentId={tournament.id} active="zgloszenia" />
      <div className="mb-4 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/panel-sedziego/turnieje/${tournament.id}/edytuj`}>Edytuj turniej</Link>
        </Button>
        <Button asChild>
          <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia/export`}>
            <Download className="h-4 w-4" />
            Eksport CSV
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista zgłoszeń</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-wrap gap-3">
            <Input className="max-w-sm" name="q" placeholder="Szukaj zawodnika" defaultValue={q} />
            <select name="status" defaultValue={status} className="rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">Każdy status</option>
              <option value="REGISTERED">Zgłoszony</option>
              <option value="WAITLIST">Lista rezerwowa</option>
              <option value="CANCELLED">Anulowany</option>
            </select>
            <Button>Filtruj</Button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Zawodnik</th>
                  <th className="py-2 pr-3">E-mail</th>
                  <th className="py-2 pr-3">Klub / miasto</th>
                  <th className="py-2 pr-3">Rok urodzenia</th>
                  <th className="py-2 pr-3">Ranking</th>
                  <th className="py-2 pr-3">Kategoria</th>
                  <th className="py-2 pr-3">Uwagi</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">
                      <Link className="text-amber-700 hover:underline" href={`/turnieje/${tournament.slug}/zawodnicy/${registration.id}`}>
                        {registration.firstName} {registration.lastName}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">{registration.email}</td>
                    <td className="py-3 pr-3">{registration.clubOrCity}</td>
                    <td className="py-3 pr-3">{registration.birthYear ?? "Brak"}</td>
                    <td className="py-3 pr-3">{registration.rating}</td>
                    <td className="py-3 pr-3">{formatChessCategory(registration.chessCategory)}</td>
                    <td className="py-3 pr-3">{registration.notes?.trim() || "Brak uwag"}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={registration.status === "REGISTERED" ? "success" : registration.status === "WAITLIST" ? "warning" : "muted"}>
                        {registrationStatusLabels[registration.status]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <RegistrationManagementActions tournamentId={tournament.id} registrationId={registration.id} status={registration.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 ? <p className="py-4 text-slate-600">Brak zgłoszeń.</p> : null}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
