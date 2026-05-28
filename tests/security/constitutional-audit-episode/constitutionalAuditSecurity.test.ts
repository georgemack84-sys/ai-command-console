import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit security", () => {
  it("detects runtime contamination and privilege escalation", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        runtimeContamination: true,
        privilegeEscalation: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_RUNTIME_CONTAMINATION");
    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_PRIVILEGE_ESCALATION");
  });
});
