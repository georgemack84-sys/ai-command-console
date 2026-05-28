import { describe, expect, it } from "vitest";
import { analyzeValidationForensics } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("forensic failure explanation", () => {
  it("produces deterministic explanations for failed validators", () => {
    const fixture = buildValidationFixture({
      treaty: {
        ...buildValidationFixture().context.treaty,
        manifest: {
          ...buildValidationFixture().context.treaty.manifest,
          governanceSnapshotHash: "",
        },
      },
    });
    const explanation = analyzeValidationForensics({
      validationId: fixture.request.validationId,
      events: fixture.output.events,
      failures: [{
        code: "VALIDATION_GOVERNANCE_FAILED",
        message: "governance snapshot hash missing",
        path: "manifest.governanceSnapshotHash",
      }],
    });

    expect(explanation.summary).toContain("governance snapshot hash missing");
    expect(explanation.explanationHash).toBe(
      analyzeValidationForensics({
        validationId: fixture.request.validationId,
        events: fixture.output.events,
        failures: [{
          code: "VALIDATION_GOVERNANCE_FAILED",
          message: "governance snapshot hash missing",
          path: "manifest.governanceSnapshotHash",
        }],
      }).explanationHash,
    );
  });
});
