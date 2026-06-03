CREATE TYPE "TournamentType" AS ENUM ('SWISS', 'ROUND_ROBIN');

CREATE TYPE "TimeControlType" AS ENUM ('CLASSICAL', 'RAPID', 'BLITZ');

CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'WAITLIST');

CREATE TABLE "Tournament" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "registrationDeadline" TIMESTAMP(3),
  "organizer" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "tournamentType" "TournamentType" NOT NULL,
  "timeControlType" "TimeControlType" NOT NULL,
  "timeControlDescription" TEXT NOT NULL,
  "rounds" INTEGER NOT NULL,
  "maxPlayers" INTEGER,
  "entryFee" TEXT,
  "regulationsUrl" TEXT,
  "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
  "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
  "allowPlayerCancellation" BOOLEAN NOT NULL DEFAULT true,
  "showRegisteredPlayers" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentRegistration" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "userId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "clubOrCity" TEXT NOT NULL,
  "federation" TEXT,
  "licenseNumber" TEXT,
  "rating" INTEGER NOT NULL,
  "chessCategory" "ChessCategory" NOT NULL,
  "phoneNumber" TEXT,
  "birthYear" INTEGER,
  "notes" TEXT,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
  "seedNumber" INTEGER,
  "startNumber" INTEGER,
  "finalRank" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_userId_key" ON "TournamentRegistration"("tournamentId", "userId");
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_email_key" ON "TournamentRegistration"("tournamentId", "email");
CREATE INDEX "TournamentRegistration_tournamentId_status_idx" ON "TournamentRegistration"("tournamentId", "status");

ALTER TABLE "Tournament"
  ADD CONSTRAINT "Tournament_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TournamentRegistration"
  ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentRegistration"
  ADD CONSTRAINT "TournamentRegistration_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
