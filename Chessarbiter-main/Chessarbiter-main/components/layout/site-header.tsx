import Link from "next/link";
import { Crown } from "lucide-react";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/components/auth/auth-actions";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
};

function getNavItems(role?: UserRole): NavItem[] {
  if (role === UserRole.ADMIN) {
    return [
      { href: "/turnieje", label: "Turnieje" },
      { href: "/panel-admina", label: "Panel administratora" },
      { href: "/panel-sedziego", label: "Panel sędziego" },
      { href: "/panel-admina/uzytkownicy", label: "Użytkownicy" }
    ];
  }

  if (role === UserRole.ARBITER) {
    return [
      { href: "/turnieje", label: "Turnieje" },
      { href: "/panel-sedziego", label: "Panel sędziego" },
      { href: "/profil", label: "Mój profil" },
      { href: "/moje-zgloszenia", label: "Moje zgłoszenia" }
    ];
  }

  if (role === UserRole.PLAYER) {
    return [
      { href: "/turnieje", label: "Turnieje" },
      { href: "/profil", label: "Mój profil" },
      { href: "/moje-zgloszenia", label: "Moje zgłoszenia" }
    ];
  }

  return [
    { href: "/turnieje", label: "Turnieje" },
    { href: "/logowanie", label: "Logowanie" },
    { href: "/rejestracja", label: "Rejestracja" }
  ];
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  const items = getNavItems(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-normal">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-400 text-slate-950">
            <Crown className="h-5 w-5" aria-hidden="true" />
          </span>
          ChessArbiter Polska
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {items.map((item) => (
            <Link key={item.href} className="rounded-md px-3 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white" href={item.href}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <form action={logoutAction}>
              <Button className="bg-white text-slate-950 hover:bg-amber-100" size="sm">
                Wyloguj
              </Button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
