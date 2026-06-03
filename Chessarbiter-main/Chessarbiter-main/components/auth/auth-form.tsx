"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthFormState } from "@/components/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formValue } from "@/lib/forms";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "register";
};

const initialState: AuthFormState = {};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const formKey = state.values ? JSON.stringify(state.values) : "initial";

  return (
    <Card className="w-full max-w-md border-white/10 bg-white text-slate-950 shadow-2xl">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Logowanie" : "Rejestracja"}</CardTitle>
        <CardDescription>
          {mode === "login" ? "Zaloguj się do panelu turniejowego." : "Nowe konto otrzyma rolę zawodnika."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={formAction} className="space-y-4">
          {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
          <TextField name="email" label="E-mail" type="email" autoComplete="email" defaultValue={formValue(state.values, "email")} error={state.fieldErrors?.email?.[0]} required />
          {mode === "register" ? (
            <TextField name="name" label="Imię i nazwisko" autoComplete="name" defaultValue={formValue(state.values, "name")} error={state.fieldErrors?.name?.[0]} />
          ) : null}
          <TextField name="password" label="Hasło" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} error={state.fieldErrors?.password?.[0]} required />
          {mode === "register" ? (
            <TextField name="confirmPassword" label="Powtórz hasło" type="password" autoComplete="new-password" error={state.fieldErrors?.confirmPassword?.[0]} required />
          ) : null}
          <Button className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "Zaloguj" : "Utwórz konto"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === "login" ? "Nie masz konta? " : "Masz już konto? "}
          <Link className="font-medium text-blue-700 hover:underline" href={mode === "login" ? "/rejestracja" : "/logowanie"}>
            {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function TextField({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className={cn(error && "border-red-500 focus-visible:ring-red-500")} {...props} />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
