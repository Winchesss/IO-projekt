"use client";

import { useActionState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { recalculateStandingsAction, type EngineActionState } from "@/components/tournament-engine/engine-actions";
import { Button } from "@/components/ui/button";

const initialState: EngineActionState = {};

export function RecalculateStandingsButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(recalculateStandingsAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button variant="outline" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
        Przelicz tabelę
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
