"use client";

import { useActionState } from "react";
import { changeUserRoleAction, type AdminActionState } from "@/components/admin/admin-actions";
import { Button } from "@/components/ui/button";

const initialState: AdminActionState = {};

export function UserRoleActions({ userId, role }: { userId: string; role: string }) {
  const [state, formAction] = useActionState(changeUserRoleAction, initialState);

  if (role === "ADMIN") {
    return <span className="text-sm text-slate-500">Administrator chroniony</span>;
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        const message = role === "ARBITER" ? "Odebrać temu użytkownikowi rolę sędziego?" : "Nadać temu użytkownikowi rolę sędziego?";
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      {role === "ARBITER" ? (
        <Button size="sm" variant="secondary" name="role" value="PLAYER">
          Usuń rolę sędziego
        </Button>
      ) : (
        <Button size="sm" name="role" value="ARBITER">
          Nadaj rolę sędziego
        </Button>
      )}
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
