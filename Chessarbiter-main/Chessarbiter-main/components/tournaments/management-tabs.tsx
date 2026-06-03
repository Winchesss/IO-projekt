import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "edytuj", label: "Ustawienia" },
  { href: "zgloszenia", label: "Zgłoszenia" },
  { href: "lista-startowa", label: "Lista startowa" },
  { href: "rundy", label: "Rundy" },
  { href: "kojarzenia", label: "Kojarzenia" },
  { href: "wyniki", label: "Wyniki" },
  { href: "tabela", label: "Tabela" },
  { href: "eksport", label: "Eksport" }
];

export function TournamentManagementTabs({ tournamentId, active }: { tournamentId: string; active: string }) {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border bg-white p-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={`/panel-sedziego/turnieje/${tournamentId}/${tab.href}`}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
            active === tab.href && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
