CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ARBITER', 'PLAYER');

CREATE TYPE "ChessCategory" AS ENUM ('NONE', 'V', 'IV', 'III', 'II', 'I', 'K', 'M', 'CM', 'FM', 'IM', 'GM', 'WCM', 'WFM', 'WIM', 'WGM');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "clubOrCity" TEXT NOT NULL,
  "federation" TEXT,
  "licenseNumber" TEXT,
  "classicalRating" INTEGER,
  "rapidRating" INTEGER,
  "blitzRating" INTEGER,
  "chessCategory" "ChessCategory" NOT NULL DEFAULT 'NONE',
  "phoneNumber" TEXT,
  "birthYear" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "User_single_admin_key" ON "User"("role") WHERE "role" = 'ADMIN';

CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");

ALTER TABLE "PlayerProfile"
  ADD CONSTRAINT "PlayerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "protect_single_admin"()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."role" = 'ADMIN' THEN
    RAISE EXCEPTION 'The administrator account cannot be deleted.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."role" = 'ADMIN' AND NEW."role" <> 'ADMIN' THEN
    RAISE EXCEPTION 'The administrator role cannot be removed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "User_protect_single_admin"
BEFORE UPDATE OR DELETE ON "User"
FOR EACH ROW
EXECUTE FUNCTION "protect_single_admin"();
