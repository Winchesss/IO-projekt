import test from "node:test";
import assert from "node:assert/strict";
import { RegistrationStatus } from "@prisma/client";
import { canCancelPlayerRegistration, getInitialRegistrationStatus } from "@/lib/registration";

test("puts player on waitlist when active limit is reached", () => {
  assert.equal(getInitialRegistrationStatus({ maxPlayers: 2 }, 1), RegistrationStatus.REGISTERED);
  assert.equal(getInitialRegistrationStatus({ maxPlayers: 2 }, 2), RegistrationStatus.WAITLIST);
});

test("allows player cancellation only before start and for active statuses", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  assert.equal(canCancelPlayerRegistration({ status: "REGISTERED", tournament: { allowPlayerCancellation: true, startDate: future } }), true);
  assert.equal(canCancelPlayerRegistration({ status: "WAITLIST", tournament: { allowPlayerCancellation: true, startDate: future } }), true);
  assert.equal(canCancelPlayerRegistration({ status: "CANCELLED", tournament: { allowPlayerCancellation: true, startDate: future } }), false);
  assert.equal(canCancelPlayerRegistration({ status: "REGISTERED", tournament: { allowPlayerCancellation: true, startDate: past } }), false);
});
