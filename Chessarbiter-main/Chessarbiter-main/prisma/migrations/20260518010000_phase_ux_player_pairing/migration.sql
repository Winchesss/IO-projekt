ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Tournament" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "PlayerProfile" ALTER COLUMN "chessCategory" DROP DEFAULT;
ALTER TABLE "PlayerProfile" ALTER COLUMN "chessCategory" TYPE TEXT USING "chessCategory"::text;
ALTER TABLE "PlayerProfile" ALTER COLUMN "chessCategory" SET DEFAULT 'NONE';

ALTER TABLE "TournamentRegistration" ALTER COLUMN "chessCategory" TYPE TEXT USING "chessCategory"::text;
