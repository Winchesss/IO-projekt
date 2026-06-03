import { RegistrationStatus, type Tournament, type TournamentRegistration } from "@prisma/client";
import { isRegistrationAvailable } from "@/lib/constants/tournaments";

export function canCreateRegistration(tournament: Pick<Tournament, "status" | "registrationOpen" | "registrationDeadline">) {
  return isRegistrationAvailable(tournament);
}

export function getInitialRegistrationStatus(
  tournament: Pick<Tournament, "maxPlayers">,
  activeRegisteredCount: number
) {
  return tournament.maxPlayers && activeRegisteredCount >= tournament.maxPlayers
    ? RegistrationStatus.WAITLIST
    : RegistrationStatus.REGISTERED;
}

export function canCancelPlayerRegistration(
  registration: Pick<TournamentRegistration, "status"> & {
    tournament: Pick<Tournament, "allowPlayerCancellation" | "startDate">;
  }
) {
  return (
    registration.tournament.allowPlayerCancellation &&
    registration.tournament.startDate > new Date() &&
    (registration.status === RegistrationStatus.REGISTERED || registration.status === RegistrationStatus.WAITLIST)
  );
}
