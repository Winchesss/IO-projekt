import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { RoundsTable } from "@/components/tournament-engine/rounds-table";
import { TournamentManagementTabs } from "@/components/tournaments/management-tabs";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";
import { requireTournamentManager } from "@/lib/permissions/tournaments";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ManageRoundPage({ params }: { params: Promise<{ id: string; roundNumber: string }> }) {
  const user = await requireRole([UserRole.ARBITER, UserRole.ADMIN]);
  const { id, roundNumber } = await params;
  const number = Number(roundNumber);
  if (!Number.isInteger(number) || number < 1) {
    notFound();
  }

  const tournament = await requireTournamentManager(user, id);
  const round = await prisma.round.findUnique({
    where: { tournamentId_roundNumber: { tournamentId: tournament.id, roundNumber: number } },
    include: {
      games: {
        orderBy: { boardNumber: "asc" },
        include: { whiteRegistration: true, blackRegistration: true }
      }
    }
  });

  if (!round) {
    notFound();
  }

  return (
    <PageShell title={`Runda ${number}: ${tournament.title}`} description="Wpisz wyniki jednej rundy bez przewijania całego turnieju.">
      <TournamentManagementTabs tournamentId={tournament.id} active="rundy" />
      <RoundsTable tournamentId={tournament.id} rounds={[round]} editable playerHrefBase={`/turnieje/${tournament.slug}/zawodnicy`} />
    </PageShell>
  );
}
