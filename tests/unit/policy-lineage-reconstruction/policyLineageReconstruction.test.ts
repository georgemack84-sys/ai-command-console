import { describe, expect, it, vi } from "vitest";
import {
  buildPolicyLineageObservabilitySurface,
  buildPolicyTimeline,
  computePolicyLineageReconstructionHash,
  getPolicyLineageContract,
  reconstructPolicyLineage,
  resolvePolicy,
  resolvePolicyDependencies,
  resolvePolicyInheritance,
  resolvePolicySupersession,
  runPolicyLineageReconstruction,
  transitionPolicyLineageState,
  validatePolicyLineageReconstruction,
  verifyPolicyReplay,
} from "@/services/policy-lineage-reconstruction";

vi.setConfig({ testTimeout: 30000 });

describe("Mission Control Phase 7G.2 Policy Lineage Reconstruction", () => {
  it("defines a deterministic advisory-only reconstruction contract", () => {
    const contract = getPolicyLineageContract();
    expect(contract.doctrine.principles).toContain("constitution-aware");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.supported_states).toEqual(["DISCOVERED", "RESOLVED", "RECONSTRUCTED", "VALIDATED", "CERTIFIED", "ARCHIVED"]);
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.replay.replay_state).toBe("REPRODUCED");
    expect(contract.reconstruction.advisory_boundary.mutates_policy).toBe(false);
  }, 20000);

  it("resolves policy identity fields before reconstruction", () => {
    const identity = resolvePolicy();
    expect(identity.policy_id).toBeTruthy();
    expect(identity.policy_version).toBeTruthy();
    expect(identity.tenant_id).toBe("tenant_alpha");
    expect(identity.mission_id).toBeTruthy();
    expect(identity.status).toBe("ACTIVE");
  });

  it("reconstructs complete policy ancestry for a governance conclusion", () => {
    const reconstruction = reconstructPolicyLineage();
    expect(reconstruction.schema_version).toBe("policy-lineage-reconstruction/v7G.2");
    expect(reconstruction.policy_history.length).toBeGreaterThanOrEqual(5);
    expect(reconstruction.parent_policies.length).toBeGreaterThan(0);
    expect(reconstruction.child_policies.length).toBeGreaterThan(0);
    expect(reconstruction.source_truth_records.length).toBeGreaterThan(0);
    expect(validatePolicyLineageReconstruction(reconstruction).validation_state).toBe("VALID");
  });

  it("rebuilds dependency, inheritance, and supersession graph families", () => {
    const reconstruction = reconstructPolicyLineage();
    expect(resolvePolicyDependencies(reconstruction).some((edge) => edge.relationship_type === "DEPENDENCY" || edge.relationship_type === "CONSTITUTIONAL")).toBe(true);
    expect(resolvePolicyInheritance(reconstruction).every((edge) => edge.relationship_type === "INHERITANCE")).toBe(true);
    expect(resolvePolicySupersession(reconstruction).every((edge) => edge.relationship_type === "SUPERSESSION")).toBe(true);
  });

  it("preserves constitutional precedence and conflict visibility", () => {
    const reconstruction = reconstructPolicyLineage({ scenario: "SUPERSESSION_INCONSISTENT" });
    expect(reconstruction.constitutional_resolutions[0]!.precedence).toBe("HIGHEST");
    expect(reconstruction.constitutional_resolutions[0]!.override_applied).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstruction).errors.some((error) => error.reason === "SUPERSESSION_INCONSISTENCY")).toBe(true);
  });

  it("builds a complete chronological policy timeline", () => {
    const timeline = buildPolicyTimeline();
    expect(timeline.map((event) => event.event_type)).toEqual(["CREATED", "ACTIVATED", "INHERITED", "MODIFIED", "SUPERSEDED", "ARCHIVED"]);
    expect(timeline.every((event, index) => index === 0 || event.timestamp >= timeline[index - 1]!.timestamp)).toBe(true);
    expect(timeline[0]!.event_hash).toBe(buildPolicyTimeline()[0]!.event_hash);
  });

  it("calculates reproducible policy influence scores", () => {
    const reconstruction = reconstructPolicyLineage();
    expect(reconstruction.influence_scores.map((score) => score.influence_level)).toContain("MANDATORY");
    expect(reconstruction.influence_scores[0]!.influence_hash).toBe(reconstructPolicyLineage().influence_scores[0]!.influence_hash);
  }, 20000);

  it("hashes and replays reconstruction deterministically", () => {
    const reconstruction = reconstructPolicyLineage();
    expect(computePolicyLineageReconstructionHash(reconstruction)).toBe(reconstruction.reconstruction_hash);
    const replay = verifyPolicyReplay(reconstruction);
    expect(replay.replay_state).toBe("REPRODUCED");
    expect(replay.reconstructed_hash).toBe(reconstruction.reconstruction_hash);
  });

  it("fails closed for identity errors", () => {
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "MISSING_POLICY_ID" })).errors.some((error) => error.error_code === "PLR-001")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "DUPLICATE_POLICY" })).errors.some((error) => error.error_code === "PLR-002")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "VERSION_NOT_FOUND" })).errors.some((error) => error.error_code === "PLR-003")).toBe(true);
  }, 20000);

  it("fails closed for missing relationship families", () => {
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "PARENT_MISSING" })).errors.some((error) => error.error_code === "PLR-004")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "DEPENDENCY_MISSING" })).errors.some((error) => error.error_code === "PLR-005")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "INHERITANCE_INCOMPLETE" })).errors.some((error) => error.error_code === "PLR-006")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "SUPERSESSION_INCONSISTENT" })).errors.some((error) => error.error_code === "PLR-007")).toBe(true);
  }, 20000);

  it("fails closed for constitutional, timeline, influence, tenant, replay, and integrity faults", () => {
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "CONSTITUTION_MISSING" })).errors.some((error) => error.error_code === "PLR-008")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "TIMELINE_GAP" })).errors.some((error) => error.error_code === "PLR-009")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "HIDDEN_INFLUENCE" })).errors.some((error) => error.error_code === "PLR-010")).toBe(true);
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "CROSS_TENANT" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validatePolicyLineageReconstruction(reconstructPolicyLineage({ scenario: "HISTORICAL_MUTATION" })).errors.some((error) => error.error_code === "PLR-013")).toBe(true);
  }, 30000);

  it("validates one-way state transitions", () => {
    expect(transitionPolicyLineageState("DISCOVERED", "CERTIFIED").allowed).toBe(true);
    expect(transitionPolicyLineageState("CERTIFIED", "RESOLVED").allowed).toBe(false);
    expect(validatePolicyLineageReconstruction({ ...reconstructPolicyLineage(), state: "UNKNOWN" as never }).errors.some((error) => error.error_code === "PLR-014")).toBe(true);
    expect(transitionPolicyLineageState("ARCHIVED", "VALIDATED").reason).toContain("reverse");
  });

  it("runs the reconstruction engine and observability surface", () => {
    const result = runPolicyLineageReconstruction();
    expect(result.validation.validation_state).toBe("VALID");
    expect(result.replay.replay_state).toBe("REPRODUCED");
    const surface = buildPolicyLineageObservabilitySurface();
    expect(surface.policy_history_count).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("advisory-only");
    expect(surface.validation_failures).toEqual([]);
  }, 20000);
});
