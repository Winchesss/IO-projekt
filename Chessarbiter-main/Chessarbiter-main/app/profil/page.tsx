import { ProfileForm } from "@/components/profile/profile-form";
import { PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: user.id }
  });

  return (
    <PageShell title="Mój profil" description="Uzupełnij dane zawodnika, aby były gotowe do zgłoszeń turniejowych.">
      <ProfileForm profile={profile} userEmail={user.email} />
    </PageShell>
  );
}
