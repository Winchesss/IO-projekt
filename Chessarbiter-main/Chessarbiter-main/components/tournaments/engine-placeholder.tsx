import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TournamentEnginePlaceholder({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-slate-600">
        <p>Ten moduł zostanie wdrożony w kolejnej fazie silnika turniejowego.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {["Rozpocznij turniej", "Rundy", "Kojarzenia", "Wyniki", "Tabela"].map((label) => (
            <button key={label} disabled className="rounded-md border bg-slate-100 px-3 py-2 text-sm text-slate-400">
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
