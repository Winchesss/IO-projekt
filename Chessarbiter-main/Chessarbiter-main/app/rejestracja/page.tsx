import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/profil");
  }

  return (
    <main className="chess-board-bg flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-950 px-4 py-12">
      <AuthForm mode="register" />
    </main>
  );
}
