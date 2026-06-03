import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Download } from "lucide-react";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id } = await params;
  const tournament = await requireTournamentManager(user, id);

  return (
    <PageShell title={`Eksport: ${tournament.title}`} description="Pobierz dane turnieju w formatach roboczych.">
      <TournamentManagementTabs tournamentId={tournament.id} active="eksport" />
      <Card>
        <CardHeader>
          <CardTitle>Eksport zgłoszeń</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-600">
          <p>Plik CSV jest zapisany w UTF-8 i zawiera polskie nagłówki zgodne z listą zgłoszeń.</p>
          <Button asChild>
            <Link href={`/panel-sedziego/turnieje/${tournament.id}/zgloszenia/export`}>
              <Download className="h-4 w-4" />
              Pobierz CSV
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/panel-sedziego/turnieje/${tournament.id}/tabela/export`}>
              <Download className="h-4 w-4" />
              Pobierz tabelę CSV
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
