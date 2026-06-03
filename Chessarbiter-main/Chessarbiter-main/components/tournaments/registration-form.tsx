"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { registerForTournamentAction, type FormState } from "@/components/tournaments/tournament-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formValue } from "@/lib/forms";
import { cn } from "@/lib/utils";

type RegistrationDefaults = {
  firstName?: string;
  lastName?: string;
  email?: string;
  clubOrCity?: string;
  federation?: string | null;
  licenseNumber?: string | null;
  rating?: number | null;
  chessCategory?: string;
  phoneNumber?: string | null;
  birthYear?: number | null;
};

const initialState: FormState = {};

export function RegistrationForm({
  tournamentId,
  defaults,
  ratingHint
}: {
  tournamentId: string;
  defaults: RegistrationDefaults;
  ratingHint: string;
}) {
  const [state, formAction, pending] = useActionState(registerForTournamentAction, initialState);
  const values = state.values;
  const formKey = values ? JSON.stringify(values) : "initial";

  return (
    <Card id="zapisy" className="border-amber-200">
      <CardHeader>
        <CardTitle>Zapisz się</CardTitle>
        <CardDescription>{ratingHint}</CardDescription>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={formAction} className="grid gap-5 sm:grid-cols-2">
          <input type="hidden" name="tournamentId" value={tournamentId} />
          {state.error ? <p className="sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
          {state.success ? <p className="sm:col-span-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}
          <TextField name="firstName" label="Imię" defaultValue={formValue(values, "firstName", defaults.firstName)} error={state.fieldErrors?.firstName?.[0]} required />
          <TextField name="lastName" label="Nazwisko" defaultValue={formValue(values, "lastName", defaults.lastName)} error={state.fieldErrors?.lastName?.[0]} required />
          <TextField name="email" label="E-mail" type="email" defaultValue={formValue(values, "email", defaults.email)} error={state.fieldErrors?.email?.[0]} required />
          <TextField name="clubOrCity" label="Klub lub miasto" defaultValue={formValue(values, "clubOrCity", defaults.clubOrCity)} error={state.fieldErrors?.clubOrCity?.[0]} required />
          <TextField name="federation" label="Federacja" defaultValue={formValue(values, "federation", defaults.federation)} error={state.fieldErrors?.federation?.[0]} />
          <TextField name="licenseNumber" label="Numer licencji" defaultValue={formValue(values, "licenseNumber", defaults.licenseNumber)} error={state.fieldErrors?.licenseNumber?.[0]} />
          <TextField name="rating" label="Ranking" type="number" defaultValue={formValue(values, "rating", defaults.rating)} error={state.fieldErrors?.rating?.[0]} required />
          <TextField name="chessCategory" label="Kategoria szachowa" placeholder="np. III, II, I, K, CM, FM, IM, GM, WFM" defaultValue={formValue(values, "chessCategory", defaults.chessCategory === "NONE" ? "" : defaults.chessCategory)} error={state.fieldErrors?.chessCategory?.[0]} />
          <TextField name="phoneNumber" label="Telefon" defaultValue={formValue(values, "phoneNumber", defaults.phoneNumber)} error={state.fieldErrors?.phoneNumber?.[0]} />
          <TextField name="birthYear" label="Rok urodzenia" type="number" defaultValue={formValue(values, "birthYear", defaults.birthYear)} error={state.fieldErrors?.birthYear?.[0]} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Uwagi</Label>
            <Textarea id="notes" name="notes" defaultValue={formValue(values, "notes")} className={cn(state.fieldErrors?.notes?.[0] && "border-red-500 focus-visible:ring-red-500")} />
            <FieldError message={state.fieldErrors?.notes?.[0]} />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Wyślij zgłoszenie
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TextField({ label, name, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className={cn(error && "border-red-500 focus-visible:ring-red-500", className)} {...props} />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-700">{message}</p> : null;
}
