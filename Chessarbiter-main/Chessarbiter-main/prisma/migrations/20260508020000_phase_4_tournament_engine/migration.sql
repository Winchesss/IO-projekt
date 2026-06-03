CREATE TYPE "RoundStatus" AS ENUM ('NOT_STARTED', 'PAIRINGS_PUBLISHED', 'IN_PROGRESS', 'COMPLETED');

CREATE TYPE "GameResult" AS ENUM ('NOT_PLAYED', 'WHITE_WIN', 'BLACK_WIN', 'DRAW', 'WHITE_FORFEIT', 'BLACK_FORFEIT', 'DOUBLE_FORFEIT', 'BYE');

CREATE TABLE "Round" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "status" "RoundStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Game" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "boardNumber" INTEGER NOT NULL,
  "whiteRegistrationId" TEXT,
  "blackRegistrationId" TEXT,
  "result" "GameResult" NOT NULL DEFAULT 'NOT_PLAYED',
  "whitePoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "blackPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "resultEnteredById" TEXT,
  "resultEnteredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentStanding" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "draws" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "forfeits" INTEGER NOT NULL DEFAULT 0,
  "buchholz" DOUBLE PRECISION,
  "medianBuchholz" DOUBLE PRECISION,
  "sonnebornBerger" DOUBLE PRECISION,
  "progressiveScore" DOUBLE PRECISION,
  "directEncounter" DOUBLE PRECISION,
  "rank" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TournamentStanding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Round_tournamentId_roundNumber_key" ON "Round"("tournamentId", "roundNumber");
CREATE INDEX "Round_tournamentId_status_idx" ON "Round"("tournamentId", "status");
CREATE UNIQUE INDEX "Game_roundId_boardNumber_key" ON "Game"("roundId", "boardNumber");
CREATE INDEX "Game_tournamentId_roundId_idx" ON "Game"("tournamentId", "roundId");
CREATE UNIQUE INDEX "TournamentStanding_registrationId_key" ON "TournamentStanding"("registrationId");
CREATE UNIQUE INDEX "TournamentStanding_tournamentId_registrationId_key" ON "TournamentStanding"("tournamentId", "registrationId");
CREATE INDEX "TournamentStanding_tournamentId_rank_idx" ON "TournamentStanding"("tournamentId", "rank");

ALTER TABLE "Round"
  ADD CONSTRAINT "Round_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "Round"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_whiteRegistrationId_fkey"
  FOREIGN KEY ("whiteRegistrationId") REFERENCES "TournamentRegistration"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_blackRegistrationId_fkey"
  FOREIGN KEY ("blackRegistrationId") REFERENCES "TournamentRegistration"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_resultEnteredById_fkey"
  FOREIGN KEY ("resultEnteredById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TournamentStanding"
  ADD CONSTRAINT "TournamentStanding_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentStanding"
  ADD CONSTRAINT "TournamentStanding_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
