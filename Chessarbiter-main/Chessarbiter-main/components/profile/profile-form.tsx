"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { updateProfileAction, type ProfileFormState } from "@/components/profile/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formValue } from "@/lib/forms";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    clubOrCity: string;
    federation: string | null;
    licenseNumber: string | null;
    classicalRating: number | null;
    rapidRating: number | null;
    blitzRating: number | null;
    chessCategory: string;
    phoneNumber: string | null;
    birthYear: number | null;
  } | null;
  userEmail: string;
};

const initialState: ProfileFormState = {};

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const formKey = state.values ? JSON.stringify(state.values) : "initial";

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>Mój profil zawodnika</CardTitle>
        <CardDescription>Dane używane przy zgłoszeniach do turniejów.</CardDescription>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={formAction} className="grid gap-5 sm:grid-cols-2">
          {state.error ? <p className="sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
          {state.success ? <p className="sm:col-span-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}
          <TextField name="firstName" label="Imię" defaultValue={formValue(state.values, "firstName", profile?.firstName)} error={state.fieldErrors?.firstName?.[0]} required />
          <TextField name="lastName" label="Nazwisko" defaultValue={formValue(state.values, "lastName", profile?.lastName)} error={state.fieldErrors?.lastName?.[0]} required />
          <TextField name="email" label="E-mail" type="email" defaultValue={formValue(state.values, "email", profile?.email ?? userEmail)} error={state.fieldErrors?.email?.[0]} required />
          <TextField name="clubOrCity" label="Klub lub miasto" defaultValue={formValue(state.values, "clubOrCity", profile?.clubOrCity)} error={state.fieldErrors?.clubOrCity?.[0]} required />
          <TextField name="federation" label="Federacja" defaultValue={formValue(state.values, "federation", profile?.federation)} error={state.fieldErrors?.federation?.[0]} />
          <TextField name="licenseNumber" label="Numer licencji" defaultValue={formValue(state.values, "licenseNumber", profile?.licenseNumber)} error={state.fieldErrors?.licenseNumber?.[0]} />
          <TextField name="classicalRating" label="Ranking klasyczny" type="number" defaultValue={formValue(state.values, "classicalRating", profile?.classicalRating)} error={state.fieldErrors?.classicalRating?.[0]} />
          <TextField name="rapidRating" label="Ranking rapid" type="number" defaultValue={formValue(state.values, "rapidRating", profile?.rapidRating)} error={state.fieldErrors?.rapidRating?.[0]} />
          <TextField name="blitzRating" label="Ranking blitz" type="number" defaultValue={formValue(state.values, "blitzRating", profile?.blitzRating)} error={state.fieldErrors?.blitzRating?.[0]} />
          <TextField name="chessCategory" label="Kategoria szachowa" placeholder="np. III, II, I, K, CM, FM, IM, GM, WFM" defaultValue={formValue(state.values, "chessCategory", profile?.chessCategory === "NONE" ? "" : profile?.chessCategory)} error={state.fieldErrors?.chessCategory?.[0]} />
          <TextField name="phoneNumber" label="Telefon" defaultValue={formValue(state.values, "phoneNumber", profile?.phoneNumber)} error={state.fieldErrors?.phoneNumber?.[0]} />
          <TextField name="birthYear" label="Rok urodzenia" type="number" defaultValue={formValue(state.values, "birthYear", profile?.birthYear)} error={state.fieldErrors?.birthYear?.[0]} />
          <div className="sm:col-span-2">
            <Button disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Zapisz profil
            </Button>
          </div>
        </form>
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
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-700">{message}</p> : null;
}
