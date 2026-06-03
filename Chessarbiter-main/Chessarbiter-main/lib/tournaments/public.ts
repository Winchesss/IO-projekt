import { Prisma, TournamentStatus } from "@prisma/client";

export type PublicTournamentFilters = {
  query?: string;
  filter?: string;
  type?: string;
  time?: string;
};

const publicTournamentStatuses: TournamentStatus[] = [
  TournamentStatus.PUBLISHED,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.FINISHED
];

export function isTournamentPublic(status: TournamentStatus | string) {
  return publicTournamentStatuses.includes(status as TournamentStatus);
}

export function getPublicTournamentWhereClause(filters: PublicTournamentFilters = {}): Prisma.TournamentWhereInput {
  const and: Prisma.TournamentWhereInput[] = [
    { deletedAt: null },
    { status: { in: publicTournamentStatuses } }
  ];
  const now = new Date();

  if (filters.query) {
    and.push({
      OR: [
        { title: { contains: filters.query, mode: "insensitive" } },
        { city: { contains: filters.query, mode: "insensitive" } },
        { location: { contains: filters.query, mode: "insensitive" } }
      ]
    });
  }

  if (filters.filter === "upcoming") {
    and.push({ startDate: { gte: now } });
    and.push({ status: { in: [TournamentStatus.PUBLISHED, TournamentStatus.REGISTRATION_CLOSED] } });
  } else if (filters.filter === "registration") {
    and.push({ status: TournamentStatus.PUBLISHED });
    and.push({ registrationOpen: true });
    and.push({ OR: [{ registrationDeadline: null }, { registrationDeadline: { gte: now } }] });
  } else if (filters.filter === "in-progress") {
    and.push({ status: TournamentStatus.IN_PROGRESS });
  } else if (filters.filter === "finished") {
    and.push({ status: TournamentStatus.FINISHED });
  } else if (filters.filter === "cancelled") {
    return {
      AND: [
        ...(filters.query
          ? [
              {
                OR: [
                  { title: { contains: filters.query, mode: "insensitive" as const } },
                  { city: { contains: filters.query, mode: "insensitive" as const } },
                  { location: { contains: filters.query, mode: "insensitive" as const } }
                ]
              }
            ]
          : []),
        { status: TournamentStatus.CANCELLED },
        { deletedAt: null },
        ...(filters.type ? [{ tournamentType: filters.type as never }] : []),
        ...(filters.time ? [{ timeControlType: filters.time as never }] : [])
      ]
    };
  }

  if (filters.type) {
    and.push({ tournamentType: filters.type as never });
  }
  if (filters.time) {
    and.push({ timeControlType: filters.time as never });
  }

  return { AND: and };
}

export function getUpcomingPublicTournamentWhereClause(): Prisma.TournamentWhereInput {
  return {
    status: { in: [TournamentStatus.PUBLISHED, TournamentStatus.REGISTRATION_CLOSED] },
    deletedAt: null,
    startDate: { gte: new Date() }
  };
}
