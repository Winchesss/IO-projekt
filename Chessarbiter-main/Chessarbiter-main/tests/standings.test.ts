import test from "node:test";
import assert from "node:assert/strict";
import { GameResult } from "@prisma/client";
import { calculateStandingRows } from "@/lib/tournament-engine/standings";

const registrations = [
  { id: "a", firstName: "Anna", lastName: "A", rating: 2000 },
  { id: "b", firstName: "Bartek", lastName: "B", rating: 1900 },
  { id: "c", firstName: "Celina", lastName: "C", rating: 1800 }
];

test("standings ignore BYE in real games and opponent tiebreaks", () => {
  const rows = calculateStandingRows(registrations, [
    {
      games: [
        { whiteRegistrationId: "a", blackRegistrationId: "b", result: GameResult.WHITE_WIN, whitePoints: 1, blackPoints: 0 },
        { whiteRegistrationId: "c", blackRegistrationId: null, result: GameResult.BYE, whitePoints: 1, blackPoints: 0 }
      ]
    },
    {
      games: [
        { whiteRegistrationId: "a", blackRegistrationId: "c", result: GameResult.DRAW, whitePoints: 0.5, blackPoints: 0.5 },
        { whiteRegistrationId: "b", blackRegistrationId: null, result: GameResult.BYE, whitePoints: 1, blackPoints: 0 }
      ]
    }
  ]);

  const anna = rows.find((row) => row.registration.id === "a")!.standing;
  const celina = rows.find((row) => row.registration.id === "c")!.standing;

  assert.equal(anna.points, 1.5);
  assert.equal(anna.gamesPlayed, 2);
  assert.equal(celina.points, 1.5);
  assert.equal(celina.gamesPlayed, 1);
  assert.equal(celina.buchholz, 1.5);
});
