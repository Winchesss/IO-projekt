import Link from "next/link";
import { CalendarDays, XCircle } from "lucide-react";
import { cancelOwnRegistrationAction } from "@/components/tournaments/tournament-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateRange, registrationStatusLabels, timeControlTypeLabels, tournamentTypeLabels } from "@/lib/constants/tournaments";

export const dynamic = "force-dynamic";

export default async function MyEntriesPage() {
  const user = await requireUser();
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { tournament: true }
  });

  return (
    <PageShell title="Moje zgłoszenia" description="Lista turniejów, do których jesteś zgłoszony.">
      <div className="grid gap-4">
        {registrations.map((registration) => {
          const canCancel =
            registration.tournament.allowPlayerCancellation &&
            registration.tournament.startDate > new Date() &&
            ["REGISTERED", "WAITLIST"].includes(registration.status);

          return (
            <Card key={registration.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{registration.tournament.title}</CardTitle>
                    <p className="mt-2 text-sm text-slate-600">{registration.tournament.city}, {registration.tournament.location}</p>
                  </div>
                  <Badge variant={registration.status === "REGISTERED" ? "success" : registration.status === "WAITLIST" ? "warning" : "muted"}>
                    {registrationStatusLabels[registration.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-amber-600" />
                    {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}
                  </span>
                  <span>{tournamentTypeLabels[registration.tournament.tournamentType]}</span>
                  <span>{timeControlTypeLabels[registration.tournament.timeControlType]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/turnieje/${registration.tournament.slug}`}>Turniej</Link>
                  </Button>
                  {canCancel ? (
                    <form action={cancelOwnRegistrationAction}>
                      <input type="hidden" name="registrationId" value={registration.id} />
                      <Button variant="secondary">
                        <XCircle className="h-4 w-4" />
                        Anuluj
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {registrations.length === 0 ? <p className="rounded-lg border bg-white p-6 text-slate-600">Nie masz jeszcze zgłoszeń.</p> : null}
      </div>
    </PageShell>
  );
}
