import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "", label: "Informacje", key: "info" },
  { href: "lista-startowa", label: "Lista startowa", key: "lista-startowa" },
  { href: "wyniki", label: "Wyniki", key: "wyniki" },
  { href: "rundy", label: "Rundy", key: "rundy" },
  { href: "tabela", label: "Tabela", key: "tabela" }
];

export function PublicTournamentNav({ slug, active }: { slug: string; active: string }) {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border bg-white p-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/turnieje/${slug}${item.href ? `/${item.href}` : ""}`}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
            active === item.key && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
