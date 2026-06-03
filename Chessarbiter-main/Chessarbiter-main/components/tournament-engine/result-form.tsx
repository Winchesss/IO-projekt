"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { enterGameResultAction, type EngineActionState } from "@/components/tournament-engine/engine-actions";
import { Button } from "@/components/ui/button";
import { gameResultLabels } from "@/lib/constants/tournaments";

const initialState: EngineActionState = {};
const results = ["WHITE_WIN", "BLACK_WIN", "DRAW", "WHITE_FORFEIT", "BLACK_FORFEIT", "DOUBLE_FORFEIT", "BYE"] as const;

export function ResultForm({
  tournamentId,
  gameId,
  defaultResult,
  bye
}: {
  tournamentId: string;
  gameId: string;
  defaultResult: string;
  bye?: boolean;
}) {
  const [state, formAction, pending] = useActionState(enterGameResultAction, initialState);
  const availableResults = bye ? ["BYE" as const] : results.filter((result) => result !== "BYE");

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="gameId" value={gameId} />
      <select name="result" defaultValue={defaultResult === "NOT_PLAYED" && bye ? "BYE" : defaultResult} className="rounded-md border bg-white px-2 py-1 text-sm">
        {defaultResult === "NOT_PLAYED" && !bye ? <option value="NOT_PLAYED">Wynik</option> : null}
        {availableResults.map((result) => (
          <option key={result} value={result}>
            {gameResultLabels[result]}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" disabled={pending}>
        <Save className="h-4 w-4" />
        Zapisz
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
