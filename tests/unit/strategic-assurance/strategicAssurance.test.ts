import { describe, expect, it } from "vitest";

import {
  getStrategicAssuranceContract,
  replayStrategicAssurance,
  runStrategicAssurance,
  validateStrategicAssurance,
} from "../../../services/strategic-assurance";
import type { StrategicAssuranceScenario } from "../../../types/strategic-assurance";

describe("strategic assurance", () => {
  it("creates deterministic certified assurance", () => {
    const first = runStrategicAssurance();
    const second = runStrategicAssurance();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.assurance_certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategicAssurance(first).valid).toBe(true);
    expect(replayStrategicAssurance(first)).toBe(true);
  });

  it("publishes strategic assurance doctrine", () => {
    const bundle = getStrategicAssuranceContract();

    expect(bundle.doctrine.one_origin_per_artifact).toBe(true);
    expect(bundle.doctrine.complete_lineage_required).toBe(true);
    expect(bundle.doctrine.deterministic_replay_required).toBe(true);
    expect(bundle.doctrine.hash_integrity_required).toBe(true);
    expect(bundle.doctrine.canonical_ownership_required).toBe(true);
    expect(bundle.doctrine.explainability_required).toBe(true);
    expect(bundle.doctrine.append_only_ledger_required).toBe(true);
  });

  it("builds complete lineage, origin, and ownership views", () => {
    const result = runStrategicAssurance();

    expect(result.lineage_graph.complete).toBe(true);
    expect(result.lineage_graph.nodes).toHaveLength(9);
    expect(result.lineage_graph.edges).toHaveLength(8);
    expect(result.origin_validation.origin_exists).toBe(true);
    expect(result.origin_validation.origin_unique).toBe(true);
    expect(result.ownership.ownership_unique).toBe(true);
    expect(result.ownership.canonical_owner).toContain("tenant_mission_control");
  });

  it("preserves replay, integrity, explainability, and ledger guarantees", () => {
    const result = runStrategicAssurance();

    expect(result.cycle_replay.certified).toBe(true);
    expect(result.artifact_replay.certified).toBe(true);
    expect(result.divergence.replay_stable).toBe(true);
    expect(result.integrity.artifact_hashes_reproduced).toBe(true);
    expect(result.integrity.ledger_hashes_reproduced).toBe(true);
    expect(result.explainability.complete).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.hash_linked).toBe(true);
  });

  it("runs the phase 12.11 certification suite", () => {
    const result = runStrategicAssurance();

    expect(result.certification.tests).toHaveLength(21);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for lineage, replay, integrity, ownership, explainability, ledger, tenancy, and governance violations", () => {
    const scenarios: readonly StrategicAssuranceScenario[] = [
      "LINEAGE_GRAPH_INCOMPLETE",
      "ORPHAN_ARTIFACT",
      "MULTIPLE_ORIGINS",
      "CIRCULAR_ORIGIN",
      "INVALID_ORIGIN",
      "FULL_REPLAY_MISMATCH",
      "ARTIFACT_REPLAY_MISMATCH",
      "DIVERGENCE_UNCLASSIFIED",
      "HASH_MISMATCH",
      "MANIFEST_HASH_MISMATCH",
      "CYCLE_HASH_MISMATCH",
      "LINEAGE_HASH_MISMATCH",
      "LEDGER_HASH_MISMATCH",
      "DUPLICATE_AUTHORITATIVE_STATE",
      "OWNERSHIP_CONFLICT",
      "EXPLAINABILITY_INCOMPLETE",
      "LEDGER_NOT_APPEND_ONLY",
      "LEDGER_NOT_HASH_LINKED",
      "CROSS_TENANT_LINEAGE",
      "GOVERNANCE_BYPASS",
      "FAIL_CLOSED_NOT_ENFORCED",
    ];

    for (const scenario of scenarios) {
      const result = runStrategicAssurance({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.assurance_certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateStrategicAssurance(result).valid).toBe(false);
    }
  });
});
