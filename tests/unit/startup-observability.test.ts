import { beforeEach, describe, expect, it } from "vitest";

import { getStartupTelemetrySnapshot, recordStartupEvent, resetStartupTelemetry } from "@/services/startup/startupTelemetry";

describe("startup observability", () => {
  beforeEach(() => {
    resetStartupTelemetry();
  });

  it("tracks startup failures and sanitizes emitted telemetry", () => {
    recordStartupEvent({
      type: "startup.failure",
      status: "failed",
      durationMs: 123,
      details: {
        DATABASE_URL: "postgres://secret@db",
      },
    });

    const snapshot = getStartupTelemetrySnapshot();
    expect(snapshot.totalAttempts).toBe(1);
    expect(snapshot.failedAttempts).toBe(1);
    expect(JSON.stringify(snapshot.events)).not.toContain("secret@db");
  });
});
