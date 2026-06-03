"use client";

import { useActionState } from "react";
import { Loader2, Play } from "lucide-react";
import { startTournamentAction, type EngineActionState } from "@/components/tournament-engine/engine-actions";
import { Button } from "@/components/ui/button";

const initialState: EngineActionState = {};

export function StartTournamentButton({ tournamentId, disabled }: { tournamentId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(startTournamentAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Rozpocząć turniej? Zapisy zostaną zamknięte, a numery startowe nadane.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button size="sm" disabled={pending || disabled}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Rozpocznij turniej
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
