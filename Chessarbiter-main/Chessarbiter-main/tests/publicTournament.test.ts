import assert from "node:assert/strict";
import test from "node:test";
import { TournamentStatus } from "@prisma/client";
import { getPublicTournamentWhereClause, isTournamentPublic } from "@/lib/tournaments/public";

test("public tournament visibility excludes drafts and cancelled tournaments by default", () => {
  assert.equal(isTournamentPublic(TournamentStatus.DRAFT), false);
  assert.equal(isTournamentPublic(TournamentStatus.CANCELLED), false);
  assert.equal(isTournamentPublic(TournamentStatus.PUBLISHED), true);
  assert.equal(isTournamentPublic(TournamentStatus.REGISTRATION_CLOSED), true);
  assert.equal(isTournamentPublic(TournamentStatus.IN_PROGRESS), true);
  assert.equal(isTournamentPublic(TournamentStatus.FINISHED), true);
});

test("default public tournament where clause is status based and not creator based", () => {
  const where = getPublicTournamentWhereClause();

  assert.deepEqual(where, {
    AND: [
      {
        deletedAt: null
      },
      {
        status: {
          in: [
            TournamentStatus.PUBLISHED,
            TournamentStatus.REGISTRATION_CLOSED,
            TournamentStatus.IN_PROGRESS,
            TournamentStatus.FINISHED
          ]
        }
      }
    ]
  });
});
