"use client";

import { useActionState } from "react";
import { manageRegistrationStatusAction, type FormState } from "@/components/tournaments/tournament-actions";
import { Button } from "@/components/ui/button";

const initialState: FormState = {};

export function RegistrationManagementActions({
  tournamentId,
  registrationId,
  status
}: {
  tournamentId: string;
  registrationId: string;
  status: string;
}) {
  const [state, formAction] = useActionState(manageRegistrationStatusAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "CANCELLED" && !window.confirm("Anulować to zgłoszenie?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="registrationId" value={registrationId} />
      {status === "WAITLIST" ? (
        <Button size="sm" name="status" value="REGISTERED">
          Przenieś do zgłoszonych
        </Button>
      ) : null}
      {status !== "CANCELLED" ? (
        <Button size="sm" variant="secondary" name="status" value="CANCELLED">
          Anuluj
        </Button>
      ) : null}
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
