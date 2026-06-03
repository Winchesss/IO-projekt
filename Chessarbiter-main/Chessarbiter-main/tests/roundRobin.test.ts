import test from "node:test";
import assert from "node:assert/strict";
import { generateRoundRobinSchedule } from "@/lib/tournament-engine/roundRobin";

function players(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: String(index + 1), startNumber: index + 1 }));
}

test("round-robin creates N - 1 rounds and every pair once for even players", () => {
  const schedule = generateRoundRobinSchedule(players(6));
  const pairs = new Set(
    schedule
      .filter((game) => game.blackRegistrationId)
      .map((game) => [game.whiteRegistrationId, game.blackRegistrationId].sort().join("-"))
  );

  assert.equal(Math.max(...schedule.map((game) => game.roundNumber)), 5);
  assert.equal(pairs.size, 15);
});

test("round-robin creates N rounds and one bye per round for odd players", () => {
  const schedule = generateRoundRobinSchedule(players(5));
  const byes = schedule.filter((game) => !game.blackRegistrationId);
  const byePlayers = new Set(byes.map((game) => game.whiteRegistrationId));

  assert.equal(Math.max(...schedule.map((game) => game.roundNumber)), 5);
  assert.equal(byes.length, 5);
  assert.equal(byePlayers.size, 5);
});
