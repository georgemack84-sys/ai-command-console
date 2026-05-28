import { describe, expect, it } from "vitest";
import { createValidationRequest } from "@/services/validation-core";
import { buildExecutionTreatyFixture } from "@/tests/execution-treaty/helpers";

describe("treaty integration", () => {
  it("consumes 4.3O treaty manifests without duplicating treaty logic", () => {
    const treaty = buildExecutionTreatyFixture().treaty;
    const request = createValidationRequest({
      targetType: "execution-treaty",
      submittedAt: "2026-05-16T13:00:00.000Z",
      treaty,
    });

    expect(request.treatyId).toBe(treaty.manifest.treatyId);
    expect(request.payloadHash).toBe(treaty.hashes.treatyHash);
  });
});
