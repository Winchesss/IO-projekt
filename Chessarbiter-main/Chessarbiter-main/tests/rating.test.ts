import test from "node:test";
import assert from "node:assert/strict";
import { getRatingForTimeControl } from "@/lib/rating";

test("selects rating matching time control", () => {
  const profile = { classicalRating: 2100, rapidRating: 1900, blitzRating: 1800 };

  assert.equal(getRatingForTimeControl(profile, "CLASSICAL"), 2100);
  assert.equal(getRatingForTimeControl(profile, "RAPID"), 1900);
  assert.equal(getRatingForTimeControl(profile, "BLITZ"), 1800);
});

test("returns null when profile is missing", () => {
  assert.equal(getRatingForTimeControl(null, "RAPID"), null);
});
