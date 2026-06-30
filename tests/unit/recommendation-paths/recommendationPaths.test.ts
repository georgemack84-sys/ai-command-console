import { describe, expect, it } from "vitest";
import {
  buildAlternativePathContract,
  buildAlternativePathDoctrine,
  buildAlternativePathObservabilitySurface,
  buildPathComparison,
  computeAlternativePathGenerationHash,
  generateAlternativeGovernancePaths,
  orderAlternativePaths,
  replayAlternativePathGeneration,
  validateAlternativePathGeneration,
} from "@/services/recommendation-paths";

describe("Mission Control Phase 7E.3 Alternative Governance Paths", () => {
  it("defines the alternative path doctrine, lifecycle, baseline contract, and PASS certification", () => {
    const doctrine = buildAlternativePathDoctrine();
    const contract = buildAlternativePathContract();
    expect(doctrine.contract_version).toBe("ALTERNATIVE-GOVERNANCE-PATHS-V1");
    expect(doctrine.path_types).toEqual(["PREFERRED_PATH", "CONSERVATIVE_PATH", "ESCALATION_PATH", "REMEDIATION_PATH"]);
    expect(doctrine.lifecycle_states).toContain("COMPARISON_READY");
    expect(contract.baseline_paths.certification_state).toBe("PASS");
  });

  it("generates preferred and conservative paths for every valid recommendation", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.paths.map((path) => path.path_type)).toEqual(expect.arrayContaining(["PREFERRED_PATH", "CONSERVATIVE_PATH"]));
    expect(validateAlternativePathGeneration(result).validation_state).toBe("VALID");
  });

  it("generates escalation path when high or critical risk requires it", () => {
    const result = generateAlternativeGovernancePaths({ scenario: "CRITICAL_RISK" });
    expect(result.paths[0].path_type).toBe("ESCALATION_PATH");
    expect(result.paths.map((path) => path.path_type)).toContain("ESCALATION_PATH");
  });

  it("generates remediation path when compliance, control, evidence, lineage, replay, or certification weakness requires it", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.paths.map((path) => path.path_type)).toContain("REMEDIATION_PATH");
  });

  it("fails when required preferred, conservative, escalation, or remediation paths are missing", () => {
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_PREFERRED" })).errors.some((error) => error.reason === "PREFERRED_PATH_MISSING")).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_CONSERVATIVE" })).errors.some((error) => error.reason === "CONSERVATIVE_PATH_MISSING")).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_ESCALATION" })).errors.some((error) => error.reason === "REQUIRED_ESCALATION_PATH_MISSING")).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_REMEDIATION" })).errors.some((error) => error.reason === "REQUIRED_REMEDIATION_PATH_MISSING")).toBe(true);
  });

  it("binds evidence per path and fails when path evidence is missing", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.paths.every((path) => path.evidence_refs.length > 0)).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_PATH_EVIDENCE" })).validation_state).toBe("UNKNOWN");
  });

  it("preserves path risk differentiation and fails when risk rationale is missing", () => {
    const result = generateAlternativeGovernancePaths();
    const residuals = new Set(result.paths.map((path) => path.residual_risk));
    expect(residuals.size).toBeGreaterThan(1);
    expect(result.paths.every((path) => path.introduced_risks.length > 0)).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "MISSING_RISK_RATIONALE" })).errors.some((error) => error.reason === "PATH_RISK_RATIONALE_MISSING")).toBe(true);
  });

  it("calculates reproducible confidence and priority for every path and detects mismatches", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.paths.every((path) => path.path_confidence_score >= 0 && path.path_confidence_score <= 100)).toBe(true);
    expect(result.paths.every((path) => path.path_priority)).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "CONFIDENCE_MISMATCH" })).errors.some((error) => error.reason === "PATH_CONFIDENCE_MISMATCH")).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "PRIORITY_MISMATCH" })).errors.some((error) => error.reason === "PATH_PRIORITY_MISMATCH")).toBe(false);
  });

  it("orders paths deterministically and detects ordering mismatch", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.ordering).toEqual(result.paths.map((path) => path.path_type));
    expect(orderAlternativePaths(result.paths).map((path) => path.path_type)).toEqual(result.ordering);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "ORDERING_MISMATCH" })).errors.some((error) => error.reason === "PATH_ORDERING_MISMATCH")).toBe(true);
  });

  it("builds reproducible operator comparison matrix and detects comparison mismatch", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.comparison.dimensions).toContain("risk_reduction");
    expect(result.comparison.matrix.PREFERRED_PATH.confidence).toBeTruthy();
    expect(buildPathComparison(result.paths[0].recommendation_id, result.paths).comparison_hash).toBe(result.comparison.comparison_hash);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "COMPARISON_MISMATCH" })).errors.some((error) => error.reason === "PATH_COMPARISON_MISMATCH")).toBe(true);
  });

  it("enforces advisory-only boundary and detects execution authority", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.paths.every((path) => path.advisory_only && !path.execution_authority && !path.mutation_authority && path.operator_action_required)).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "EXECUTION_AUTHORITY" })).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("preserves tenant isolation and blocks cross-tenant paths", () => {
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths()).checks.tenant_isolated).toBe(true);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "CROSS_TENANT" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("records Truth Ledger path records and fails when ledger recording is missing", () => {
    const result = generateAlternativeGovernancePaths();
    expect(result.ledger_record.path_ledger_id).toBeTruthy();
    expect(result.ledger_record.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "PATH_LEDGER_FAILURE" })).errors.some((error) => error.reason === "PATH_LEDGER_RECORD_MISSING")).toBe(true);
  });

  it("replays path generation and detects path replay mismatch", () => {
    const result = generateAlternativeGovernancePaths();
    expect(replayAlternativePathGeneration(result).replay_state).toBe("REPRODUCED");
    expect(validateAlternativePathGeneration(generateAlternativeGovernancePaths({ scenario: "PATH_REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(replayAlternativePathGeneration({ ...result, path_generation_hash: "tampered" }).replay_state).toBe("MISMATCH");
  });

  it("detects hidden path state", () => {
    const result = generateAlternativeGovernancePaths();
    expect(validateAlternativePathGeneration({ ...result, hidden_path_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("exposes operator visibility for all paths, rationale, evidence, risk, confidence, ordering, replay, and advisory notice", () => {
    const surface = buildAlternativePathObservabilitySurface(generateAlternativeGovernancePaths());
    expect(surface.path_count).toBeGreaterThanOrEqual(2);
    expect(surface.path_types).toContain("PREFERRED_PATH");
    expect(surface.path_types).toContain("CONSERVATIVE_PATH");
    expect(surface.preferred_path).toBeTruthy();
    expect(surface.ordering_rationale).toBeTruthy();
    expect(surface.advisory_only_notice).toContain("advisory only");
    expect(surface.replay_state).toBe("REPRODUCED");
  });

  it("computes stable path generation hashes and PASS for valid generation", () => {
    const result = generateAlternativeGovernancePaths();
    expect(computeAlternativePathGenerationHash(result)).toBe(result.path_generation_hash);
    expect(result.validation_state).toBe("VALID");
    expect(result.replay_state).toBe("REPRODUCED");
    expect(result.certification_state).toBe("PASS");
  });
});
