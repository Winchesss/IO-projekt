import test from "node:test";
import assert from "node:assert/strict";
import { chooseByePlayer, pairScoreGroup } from "@/lib/tournament-engine/swiss";

const players = [
  { id: "1", firstName: "A", lastName: "A", rating: 2200, startNumber: 1, points: 2 },
  { id: "2", firstName: "B", lastName: "B", rating: 2100, startNumber: 2, points: 2 },
  { id: "3", firstName: "C", lastName: "C", rating: 2000, startNumber: 3, points: 1 },
  { id: "4", firstName: "D", lastName: "D", rating: 1900, startNumber: 4, points: 1 }
];

test("Swiss bye prefers lowest scoring player without previous bye", () => {
  const bye = chooseByePlayer(players, new Set(["4"]));

  assert.equal(bye.id, "3");
});

test("Swiss score group pairing avoids previous opponent when possible", () => {
  const previousOpponents = new Map<string, Set<string>>([["1", new Set(["3"])]]);
  const pairings = pairScoreGroup(players, previousOpponents, new Map());
  const firstPlayerOpponent = pairings.find((pairing) => pairing.whiteRegistrationId === "1" || pairing.blackRegistrationId === "1");

  assert.ok(firstPlayerOpponent);
  assert.notEqual(firstPlayerOpponent?.whiteRegistrationId === "1" ? firstPlayerOpponent.blackRegistrationId : firstPlayerOpponent?.whiteRegistrationId, "3");
});
