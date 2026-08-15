import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { assertLegacyAutonomyAllowed, legacyAutonomyStatus } = require("../services/legacyAutonomyPolicy");

test("legacy autonomy remains available for local development", () => {
  assert.equal(legacyAutonomyStatus({ NODE_ENV: "development" }).allowed, true);
});

test("legacy autonomy fails closed in production", () => {
  assert.throws(
    () => assertLegacyAutonomyAllowed("test", { NODE_ENV: "production" }),
    (error) => error.code === "LEGACY_AUTONOMY_QUARANTINED",
  );
});

test("production requires both explicit enablement and risk acceptance", () => {
  assert.equal(
    legacyAutonomyStatus({
      NODE_ENV: "production",
      LEGACY_AUTONOMOUS_EXECUTION_ENABLED: "true",
      LEGACY_AUTONOMOUS_EXECUTION_RISK_ACCEPTED: "true",
    }).allowed,
    true,
  );
  assert.equal(
    legacyAutonomyStatus({
      NODE_ENV: "production",
      LEGACY_AUTONOMOUS_EXECUTION_ENABLED: "true",
    }).allowed,
    false,
  );
});
