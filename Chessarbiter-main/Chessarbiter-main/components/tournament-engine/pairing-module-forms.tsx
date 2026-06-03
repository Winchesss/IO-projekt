"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { addManualPairingAction, addManualParticipantAction, type EngineActionState } from "@/components/tournament-engine/engine-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: EngineActionState = {};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  startNumber: number | null;
};

export function ManualParticipantForm({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(addManualParticipantAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Input name="firstName" placeholder="Imię" required />
      <Input name="lastName" placeholder="Nazwisko" required />
      <Input name="clubOrCity" placeholder="Klub / miasto" required />
      <Input name="rating" type="number" min={0} max={4000} placeholder="Ranking" required />
      <Input name="chessCategory" placeholder="Kategoria, np. III, K, FM" />
      <Input name="birthYear" type="number" placeholder="Rok urodzenia" />
      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <Button disabled={pending}>
          <Plus className="h-4 w-4" />
          Dodaj zawodnika ręcznie
        </Button>
        {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
        {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
      </div>
    </form>
  );
}

export function ManualPairingForm({ tournamentId, participants, nextRoundNumber }: { tournamentId: string; participants: Participant[]; nextRoundNumber: number }) {
  const [state, formAction, pending] = useActionState(addManualPairingAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <Input name="roundNumber" type="number" min={1} defaultValue={nextRoundNumber} placeholder="Runda" required />
      <Input name="boardNumber" type="number" min={1} placeholder="Szachownica" required />
      <select name="whiteRegistrationId" required className="rounded-md border bg-white px-3 py-2 text-sm">
        <option value="">Białe</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.id}>{playerLabel(participant)}</option>
        ))}
      </select>
      <select name="blackRegistrationId" className="rounded-md border bg-white px-3 py-2 text-sm">
        <option value="">Pauza</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.id}>{playerLabel(participant)}</option>
        ))}
      </select>
      <Button disabled={pending}>
        <Plus className="h-4 w-4" />
        Dodaj kojarzenie
      </Button>
      <div className="sm:col-span-2 lg:col-span-5">
        {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
        {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
      </div>
    </form>
  );
}

function playerLabel(player: Participant) {
  return `${player.startNumber ? `${player.startNumber}. ` : ""}${player.firstName} ${player.lastName} (${player.rating})`;
}
