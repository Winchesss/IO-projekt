import Link from "next/link";
import { UserRole } from "@prisma/client";
import { ClipboardList, Crown, ShieldCheck, Trophy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPanelPage() {
  await requireAdmin();

  const [usersCount, arbitersCount, playersCount, tournamentsCount, registrationsCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.ARBITER } }),
    prisma.user.count({ where: { role: UserRole.PLAYER } }),
    prisma.tournament.count(),
    prisma.tournamentRegistration.count()
  ]);

  return (
    <PageShell title="Panel administratora" description="Przegląd platformy i skróty administracyjne.">
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/panel-admina/uzytkownicy">Użytkownicy</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/panel-admina/turnieje">Wszystkie turnieje</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Summary title="Użytkownicy" value={usersCount} icon={<UserRound className="h-5 w-5" />} />
        <Summary title="Sędziowie" value={arbitersCount} icon={<ShieldCheck className="h-5 w-5" />} />
        <Summary title="Zawodnicy" value={playersCount} icon={<Crown className="h-5 w-5" />} />
        <Summary title="Turnieje" value={tournamentsCount} icon={<Trophy className="h-5 w-5" />} />
        <Summary title="Zgłoszenia" value={registrationsCount} icon={<ClipboardList className="h-5 w-5" />} />
      </div>
    </PageShell>
  );
}

function Summary({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700">{icon}</span>
        <p className="text-sm text-slate-600">{title}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
