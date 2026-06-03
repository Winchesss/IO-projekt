import { redirect } from "next/navigation";

export default async function TournamentPairingRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/panel-sedziego/kojarzenia/${id}`);
}
