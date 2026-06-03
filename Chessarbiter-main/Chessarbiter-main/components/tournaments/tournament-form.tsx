"use client";

import { useActionState } from "react";
import { Loader2, Save, Send } from "lucide-react";
import { createTournamentAction, updateTournamentAction, type FormState } from "@/components/tournaments/tournament-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  timeControlTypeLabels,
  timeControlTypes,
  tournamentStatusLabels,
  tournamentStatuses,
  tournamentTypeLabels,
  tournamentTypes
} from "@/lib/constants/tournaments";
import { formValue, type FormValues } from "@/lib/forms";
import { cn } from "@/lib/utils";

type TournamentFormData = {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  startDate?: Date;
  endDate?: Date | null;
  registrationDeadline?: Date | null;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  tournamentType?: string;
  timeControlType?: string;
  timeControlDescription?: string;
  rounds?: number;
  maxPlayers?: number | null;
  entryFee?: string | null;
  regulationsUrl?: string | null;
  status?: string;
  registrationOpen?: boolean;
  allowPlayerCancellation?: boolean;
  showRegisteredPlayers?: boolean;
};

const initialState: FormState = {};

export function TournamentForm({ tournament }: { tournament?: TournamentFormData }) {
  const action = tournament?.id ? updateTournamentAction : createTournamentAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values;
  const formKey = values ? JSON.stringify(values) : "initial";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{tournament?.id ? "Edycja turnieju" : "Nowy turniej"}</CardTitle>
            <CardDescription>Zapisz szkic albo opublikuj turniej dla zawodników.</CardDescription>
          </div>
          {tournament?.status ? <Badge variant="secondary">{tournamentStatusLabels[tournament.status as keyof typeof tournamentStatusLabels]}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={formAction} className="grid gap-5 lg:grid-cols-2">
          {tournament?.id ? <input type="hidden" name="id" value={tournament.id} /> : null}
          {state.error ? <p className="lg:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
          {state.success ? <p className="lg:col-span-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}

          <TextField name="title" label="Nazwa turnieju" defaultValue={formValue(values, "title", tournament?.title)} error={state.fieldErrors?.title?.[0]} required />
          <TextField name="city" label="Miasto" defaultValue={formValue(values, "city", tournament?.city)} error={state.fieldErrors?.city?.[0]} required />
          <TextField name="location" label="Miejsce" defaultValue={formValue(values, "location", tournament?.location)} error={state.fieldErrors?.location?.[0]} required />
          <TextField name="organizer" label="Organizator" defaultValue={formValue(values, "organizer", tournament?.organizer)} error={state.fieldErrors?.organizer?.[0]} required />
          <TextField name="contactEmail" label="E-mail kontaktowy" type="email" defaultValue={formValue(values, "contactEmail", tournament?.contactEmail)} error={state.fieldErrors?.contactEmail?.[0]} required />
          <TextField name="contactPhone" label="Telefon kontaktowy" defaultValue={formValue(values, "contactPhone", tournament?.contactPhone)} error={state.fieldErrors?.contactPhone?.[0]} />
          <TextField name="startDate" label="Data startu" type="datetime-local" defaultValue={formValue(values, "startDate", dateValue(tournament?.startDate))} error={state.fieldErrors?.startDate?.[0]} required />
          <TextField name="endDate" label="Data zakończenia" type="datetime-local" defaultValue={formValue(values, "endDate", dateValue(tournament?.endDate))} error={state.fieldErrors?.endDate?.[0]} />
          <TextField name="registrationDeadline" label="Termin zapisów" type="datetime-local" defaultValue={formValue(values, "registrationDeadline", dateValue(tournament?.registrationDeadline))} error={state.fieldErrors?.registrationDeadline?.[0]} />
          <TextField name="rounds" label="Liczba rund" type="number" defaultValue={formValue(values, "rounds", tournament?.rounds ?? 7)} error={state.fieldErrors?.rounds?.[0]} required />
          <TextField name="maxPlayers" label="Limit miejsc" type="number" defaultValue={formValue(values, "maxPlayers", tournament?.maxPlayers)} error={state.fieldErrors?.maxPlayers?.[0]} />
          <TextField name="entryFee" label="Wpisowe" defaultValue={formValue(values, "entryFee", tournament?.entryFee)} error={state.fieldErrors?.entryFee?.[0]} />

          <SelectField name="tournamentType" label="System" defaultValue={formValue(values, "tournamentType", tournament?.tournamentType ?? "SWISS")} items={tournamentTypes} labels={tournamentTypeLabels} error={state.fieldErrors?.tournamentType?.[0]} />
          <SelectField name="timeControlType" label="Rodzaj tempa" defaultValue={formValue(values, "timeControlType", tournament?.timeControlType ?? "RAPID")} items={timeControlTypes} labels={timeControlTypeLabels} error={state.fieldErrors?.timeControlType?.[0]} />
          <TextField name="timeControlDescription" label="Tempo gry" defaultValue={formValue(values, "timeControlDescription", tournament?.timeControlDescription)} error={state.fieldErrors?.timeControlDescription?.[0]} required />
          <TextField name="regulationsUrl" label="Regulamin URL" defaultValue={formValue(values, "regulationsUrl", tournament?.regulationsUrl)} error={state.fieldErrors?.regulationsUrl?.[0]} />

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={formValue(values, "description", tournament?.description)}
              className={cn(state.fieldErrors?.description?.[0] && "border-red-500 focus-visible:ring-red-500")}
              required
            />
            <FieldError message={state.fieldErrors?.description?.[0]} />
          </div>

          {tournament?.id ? (
            <SelectField name="status" label="Status" defaultValue={formValue(values, "status", tournament.status ?? "DRAFT")} items={tournamentStatuses} labels={tournamentStatusLabels} error={state.fieldErrors?.status?.[0]} />
          ) : (
            <input type="hidden" name="status" value="DRAFT" />
          )}

          <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 lg:col-span-2 sm:grid-cols-3">
            <CheckboxField name="registrationOpen" label="Zapisy otwarte" defaultChecked={checkedValue(values, "registrationOpen", tournament?.registrationOpen ?? false)} />
            <CheckboxField name="allowPlayerCancellation" label="Zawodnik może anulować" defaultChecked={checkedValue(values, "allowPlayerCancellation", tournament?.allowPlayerCancellation ?? true)} />
            <CheckboxField name="showRegisteredPlayers" label="Pokaż listę zgłoszeń" defaultChecked={checkedValue(values, "showRegisteredPlayers", tournament?.showRegisteredPlayers ?? true)} />
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button name="intent" value="save" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Zapisz
            </Button>
            <Button name="intent" value="draft" variant="secondary" disabled={pending}>
              Zapisz jako szkic
            </Button>
            <Button name="intent" value="publish" className="bg-amber-500 text-slate-950 hover:bg-amber-400" disabled={pending}>
              <Send className="h-4 w-4" />
              Opublikuj
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

function SelectField({
  label,
  name,
  defaultValue,
  items,
  labels,
  error
}: {
  label: string;
  name: string;
  defaultValue: string;
  items: readonly string[];
  labels: Partial<Record<string, string>>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className={cn(error && "border-red-500 focus-visible:ring-red-500")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {labels[item] ?? item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  );
}

function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-slate-950" />
      {label}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-700">{message}</p> : null;
}

function checkedValue(values: FormValues | undefined, name: string, fallback: boolean) {
  return values ? values[name] === "on" : fallback;
}

function dateValue(date?: Date | null) {
  if (!date) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
