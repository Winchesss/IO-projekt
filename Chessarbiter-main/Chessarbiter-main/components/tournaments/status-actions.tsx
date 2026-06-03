"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changeTournamentStatusAction, type FormState } from "@/components/tournaments/tournament-actions";
import { Button } from "@/components/ui/button";

const initialState: FormState = {};

export function TournamentStatusActions({
  tournamentId,
  actions
}: {
  tournamentId: string;
  actions: Array<{ to: string; label: string; confirmation?: string; disabled?: boolean }>;
}) {
  const [state, formAction, pending] = useActionState(changeTournamentStatusAction, initialState);

  if (actions.length === 0) {
    return <p className="text-sm text-slate-500">Brak dostępnych zmian statusu.</p>;
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const confirmation = submitter?.dataset.confirmation;
        if (confirmation && !window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      {actions.map((action) => (
        <Button key={action.to} size="sm" variant="outline" name="status" value={action.to} disabled={pending || action.disabled} data-confirmation={action.confirmation}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {action.label}
        </Button>
      ))}
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
