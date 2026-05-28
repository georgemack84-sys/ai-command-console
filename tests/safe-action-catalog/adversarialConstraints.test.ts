import { describe, expect, it } from "vitest";

import { deriveSafeActionProfile } from "@/services/safe-action-catalog";
import { buildSafeActionFixture } from "./helpers";

describe("safeAction adversarial constraints", () => {
  it("denies undefined action injection", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const profile = deriveSafeActionProfile({
      readinessProfile,
      actionId: "safe-action:undefined",
    });
    expect(profile.errors.some((error) => error.code === "SAFE_ACTION_UNDEFINED")).toBe(true);
  });

  it("denies hidden execution paths and self-approval attempts", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const profile = deriveSafeActionProfile({
      readinessProfile,
      actionId: "safe-action:recommend",
      metadata: Object.freeze({
        execute: true,
        approvalGranted: true,
      }),
    });
    expect(profile.errors.map((error) => error.code)).toContain("SAFE_ACTION_HIDDEN_EXECUTION_FORBIDDEN");
    expect(profile.errors.map((error) => error.code)).toContain("SAFE_ACTION_APPROVAL_MASQUERADE");
  });

  it("denies fake pause authority and forbidden A6 usage", () => {
    const { readinessProfile } = buildSafeActionFixture({ autonomyLevel: "A6" });
    const profile = deriveSafeActionProfile({
      readinessProfile,
      actionId: "safe-action:pause_request",
      metadata: Object.freeze({
        pauseAuthority: true,
      }),
    });
    expect(profile.errors.map((error) => error.code)).toContain("SAFE_ACTION_FAKE_PAUSE_AUTHORITY");
    expect(profile.scope.state).toBe("denied");
  });

  it("denies action use during disputed readiness", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const disputed: typeof readinessProfile = Object.freeze({
      ...readinessProfile,
      derivedState: "disputed" as const,
      disputes: Object.freeze([
        {
          code: "AUTONOMY_DISPUTED" as const,
          reason: "Injected dispute",
        },
      ]),
      governanceBinding: Object.freeze({
        ...readinessProfile.governanceBinding,
        disputed: true,
      }),
    });
    const profile = deriveSafeActionProfile({
      readinessProfile: disputed,
      actionId: "safe-action:observe",
    });
    expect(profile.errors.map((error) => error.code)).toContain("SAFE_ACTION_DISPUTED");
    expect(profile.scope.state).toBe("disputed");
  });
});
