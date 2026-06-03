import type { GameResult, RegistrationStatus, RoundStatus, TimeControlType, TournamentStatus, TournamentType } from "@prisma/client";

export const tournamentTypes = ["SWISS", "ROUND_ROBIN"] as const satisfies readonly TournamentType[];
export const timeControlTypes = ["CLASSICAL", "RAPID", "BLITZ"] as const satisfies readonly TimeControlType[];
export const tournamentStatuses = [
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED"
] as const satisfies readonly TournamentStatus[];
export const registrationStatuses = ["REGISTERED", "WAITLIST", "CANCELLED"] as const satisfies readonly RegistrationStatus[];
export const roundStatuses = ["NOT_STARTED", "PAIRINGS_PUBLISHED", "IN_PROGRESS", "COMPLETED"] as const satisfies readonly RoundStatus[];
export const gameResults = [
  "NOT_PLAYED",
  "WHITE_WIN",
  "BLACK_WIN",
  "DRAW",
  "WHITE_FORFEIT",
  "BLACK_FORFEIT",
  "DOUBLE_FORFEIT",
  "BYE"
] as const satisfies readonly GameResult[];

export const tournamentTypeLabels: Record<TournamentType, string> = {
  SWISS: "System szwajcarski",
  ROUND_ROBIN: "System kołowy"
};

export const timeControlTypeLabels: Record<TimeControlType, string> = {
  CLASSICAL: "Klasyczne",
  RAPID: "Szybkie",
  BLITZ: "Błyskawiczne"
};

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  DRAFT: "Szkic",
  PUBLISHED: "Opublikowany",
  REGISTRATION_CLOSED: "Zapisy zamknięte",
  IN_PROGRESS: "W trakcie",
  FINISHED: "Zakończony",
  CANCELLED: "Odwołany"
};

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  REGISTERED: "Zgłoszony",
  WAITLIST: "Lista rezerwowa",
  CANCELLED: "Anulowany"
};

export const roundStatusLabels: Record<RoundStatus, string> = {
  NOT_STARTED: "Nierozpoczęta",
  PAIRINGS_PUBLISHED: "Kojarzenia opublikowane",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończona"
};

export const gameResultLabels: Record<GameResult, string> = {
  NOT_PLAYED: "Nie rozegrano",
  WHITE_WIN: "1-0",
  BLACK_WIN: "0-1",
  DRAW: "½-½",
  WHITE_FORFEIT: "+/-",
  BLACK_FORFEIT: "-/+",
  DOUBLE_FORFEIT: "-/-",
  BYE: "Pauza"
};

export function formatDateRange(startDate: Date, endDate?: Date | null) {
  const formatter = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
  const start = formatter.format(startDate);

  if (!endDate) {
    return start;
  }

  return `${start} - ${formatter.format(endDate)}`;
}

export function isRegistrationAvailable(tournament: {
  status: TournamentStatus;
  registrationOpen: boolean;
  registrationDeadline?: Date | null;
}) {
  if (!tournament.registrationOpen || tournament.status !== "PUBLISHED") {
    return false;
  }

  if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
    return false;
  }

  return true;
}

export function activeRegistrationWhere() {
  return { status: "REGISTERED" as const };
}
