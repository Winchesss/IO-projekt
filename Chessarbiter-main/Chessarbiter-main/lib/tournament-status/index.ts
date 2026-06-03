import { TournamentStatus, UserRole } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";

type TransitionRule = {
  to: TournamentStatus;
  label: string;
  confirmation?: string;
  adminOnly?: boolean;
  disabled?: boolean;
};

const transitions: Record<TournamentStatus, TransitionRule[]> = {
  DRAFT: [{ to: "PUBLISHED", label: "Opublikuj" }],
  PUBLISHED: [
    { to: "REGISTRATION_CLOSED", label: "Zamknij zapisy", confirmation: "Zamknąć zapisy dla tego turnieju?" },
    { to: "CANCELLED", label: "Odwołaj", confirmation: "Odwołać ten turniej?" },
    { to: "IN_PROGRESS", label: "Rozpocznij turniej", disabled: true }
  ],
  REGISTRATION_CLOSED: [
    { to: "PUBLISHED", label: "Otwórz zapisy" },
    { to: "CANCELLED", label: "Odwołaj", confirmation: "Odwołać ten turniej?" },
    { to: "IN_PROGRESS", label: "Rozpocznij turniej", disabled: true }
  ],
  IN_PROGRESS: [
    { to: "FINISHED", label: "Zakończ turniej", disabled: true },
    { to: "CANCELLED", label: "Odwołaj", confirmation: "Odwołanie trwającego turnieju wymaga administratora.", adminOnly: true }
  ],
  FINISHED: [],
  CANCELLED: []
};

export function getAllowedTournamentTransitions(status: TournamentStatus, user: SessionUser) {
  return transitions[status].filter((transition) => !transition.adminOnly || user.role === UserRole.ADMIN);
}

export function canTransitionTournamentStatus(from: TournamentStatus, to: TournamentStatus, user: SessionUser) {
  return getAllowedTournamentTransitions(from, user).some((transition) => transition.to === to && !transition.disabled);
}

export function canStartTournamentStatus(status: TournamentStatus) {
  return status === TournamentStatus.PUBLISHED || status === TournamentStatus.REGISTRATION_CLOSED;
}

export function isFinalTournamentStatus(status: TournamentStatus) {
  return status === TournamentStatus.FINISHED || status === TournamentStatus.CANCELLED;
}
