import { UserRole } from "@prisma/client";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/session";

export default async function NewTournamentPage() {
  await requireRole([UserRole.ARBITER, UserRole.ADMIN]);

  return (
    <PageShell title="Dodaj turniej" description="Utwórz szkic albo od razu opublikuj turniej.">
      <TournamentForm />
    </PageShell>
  );
}
