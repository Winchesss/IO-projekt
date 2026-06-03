"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  completeRoundAction,
  createManualRoundAction,
  finishTournamentAction,
  finishTournamentEarlyAction,
  generateNextSwissRoundAction,
  type EngineActionState
} from "@/components/tournament-engine/engine-actions";
import { Button } from "@/components/ui/button";

const initialState: EngineActionState = {};

export function CreateRoundButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(createManualRoundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Utwórz rundę testową
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}

export function CompleteRoundButton({ tournamentId, roundId, disabled }: { tournamentId: string; roundId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(completeRoundAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Zakończyć rundę i przeliczyć tabelę?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="roundId" value={roundId} />
      <Button size="sm" variant="outline" disabled={pending || disabled}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Zakończ rundę
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}

export function FinishTournamentButton({ tournamentId, disabled }: { tournamentId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(finishTournamentAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Zakończyć turniej? Ta operacja zamknie cykl rozgrywek.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button disabled={pending || disabled} variant="secondary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Zakończ turniej
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}

export function FinishTournamentEarlyButton({ tournamentId, disabled }: { tournamentId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(finishTournamentEarlyAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Czy na pewno chcesz zakończyć turniej wcześniej? Aktualna tabela zostanie uznana za końcową.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button disabled={pending || disabled} variant="secondary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Zakończ turniej wcześniej
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}

export function GenerateSwissRoundButton({ tournamentId, disabled }: { tournamentId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(generateNextSwissRoundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Button disabled={pending || disabled}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Wygeneruj następną rundę
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
