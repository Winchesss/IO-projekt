"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTournamentAction, type FormState } from "@/components/tournaments/tournament-actions";
import { Button } from "@/components/ui/button";

const initialState: FormState = {};

export function DeleteTournamentButton({ tournamentId, hasData }: { tournamentId: string; hasData: boolean }) {
  const [state, formAction, pending] = useActionState(deleteTournamentAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        const message = hasData
          ? "Czy na pewno chcesz usunąć ten turniej? Turniej ma zgłoszenia, rundy, partie lub tabelę. Tej operacji nie można cofnąć."
          : "Czy na pewno chcesz usunąć ten turniej? Tej operacji nie można cofnąć.";
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200" disabled={pending}>
        <Trash2 className="h-4 w-4" />
        Usuń turniej
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
