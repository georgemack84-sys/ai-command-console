import { describe, expect, it } from "vitest";
import { buildDegradedCuration } from "@/src/server/services/nuru-agent-failure-service";

describe("Nuru agent failure handling", () => {
  it("preserves completed work while explicitly reporting unavailable analysis", () => {
    const result = buildDegradedCuration([{ specialist: "Discovery", status: "success" }, { specialist: "Context", status: "success" }, { specialist: "Connection", status: "tool_failure", detail: "Embedding index unavailable." }, { specialist: "Quality", status: "success" }]);
    expect(result).toMatchObject({ status: "CURATION_INCOMPLETE", degraded: true, completedSpecialists: ["Discovery", "Context", "Quality"], unavailable: [{ specialist: "Connection", reason: "Embedding index unavailable." }] });
  });
});
