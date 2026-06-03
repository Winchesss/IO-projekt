import test from "node:test";
import assert from "node:assert/strict";
import { canAccessAdminPanel, canAccessArbiterPanel } from "@/lib/permissions/roles";

test("role helpers distinguish admin, arbiter, and player access", () => {
  assert.equal(canAccessAdminPanel("ADMIN"), true);
  assert.equal(canAccessAdminPanel("ARBITER"), false);
  assert.equal(canAccessArbiterPanel("ADMIN"), true);
  assert.equal(canAccessArbiterPanel("ARBITER"), true);
  assert.equal(canAccessArbiterPanel("PLAYER"), false);
});
