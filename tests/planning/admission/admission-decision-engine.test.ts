import { describe, expect, it } from "vitest";

import { buildAdmissionReadiness } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission decision engine", () => {
  it("returns APPROVED for valid input", () => {
    const fixture = buildAdmissionFixture();
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("APPROVED");
  });

  it("denies admission when approvals are missing", () => {
    const fixture = buildAdmissionFixture();
    (fixture.governanceMetadata as { approvalsSatisfied: boolean }).approvalsSatisfied = false;
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("DENIED");
  });

  it("returns SIMULATION_REQUIRED when policy requires simulation", () => {
    const fixture = buildAdmissionFixture();
    (fixture.governanceMetadata as { requiredSimulation?: boolean }).requiredSimulation = true;
    (fixture as { simulationReadiness: NonNullable<typeof fixture.simulationReadiness> }).simulationReadiness = {
      ...fixture.simulationReadiness!,
      ready: false,
    };
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("SIMULATION_REQUIRED");
  });

  it("escalates on governance conflict", () => {
    const fixture = buildAdmissionFixture();
    (fixture.governanceMetadata as { conflicts?: string[] }).conflicts = ["policy mismatch"];
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("ESCALATED");
  });
});
