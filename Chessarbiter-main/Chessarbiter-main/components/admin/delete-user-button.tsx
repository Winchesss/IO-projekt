"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAction, type AdminActionState } from "@/components/admin/admin-actions";
import { Button } from "@/components/ui/button";

const initialState: AdminActionState = {};

export function DeleteUserButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Czy na pewno chcesz usunąć to konto użytkownika?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <Button size="sm" variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200" disabled={pending}>
        <Trash2 className="h-4 w-4" />
        Usuń
      </Button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
