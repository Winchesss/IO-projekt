import { UserRole } from "@prisma/client";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);
  const counts = await prisma.tournament.findUnique({
    where: { id: tournament.id },
    select: {
      _count: { select: { registrations: true, tournamentRounds: true, games: true, standings: true } }
    }
  });
  const hasData = Boolean(counts && (counts._count.registrations || counts._count.tournamentRounds || counts._count.games || counts._count.standings));

  return (
    <PageShell title="Edycja turnieju" description="Zmień dane turnieju, status i dostępność zapisów.">
      <TournamentManagementTabs tournamentId={tournament.id} active="edytuj" />
      <TournamentForm tournament={tournament} />
      <Card className="mt-6 border-red-200">
        <CardHeader>
          <CardTitle>Usuwanie turnieju</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Usunięty turniej zostanie ukryty z list i stron publicznych, a dane historyczne pozostaną w bazie.</p>
          <DeleteTournamentButton tournamentId={tournament.id} hasData={hasData} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
