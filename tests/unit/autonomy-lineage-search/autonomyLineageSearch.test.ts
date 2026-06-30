import { describe, expect, it } from "vitest";
import {
  buildAutonomyLineageSearchObservabilitySurface,
  getAutonomyLineageSearchContract,
  runAutonomyLineageSearch,
  validateAutonomyLineageSearch,
} from "@/services/autonomy-lineage-search";
import type { AutonomyLineageSearchErrorState, AutonomyLineageSearchScenario } from "@/types/autonomy-lineage-search";

describe("Mission Control Phase 8I.7 Autonomy Lineage Search", () => {
  it("defines the read-only lineage search doctrine", () => {
    const contract = getAutonomyLineageSearchContract();

    expect(contract.doctrine.schema_version).toBe("autonomy-lineage-search/v8I.7");
    expect(contract.doctrine.principles).toContain("replayable");
    expect(contract.doctrine.search_types).toContain("INFLUENCE_CHAIN");
    expect(contract.doctrine.relationship_types).toEqual(["DERIVED_FROM", "DEPENDS_ON", "BLOCKED_BY", "AUTHORIZED_BY", "REJECTED_BY", "SUPERVISED_BY", "INTERVENED_BY", "REPLAYED_BY", "VERIFIED_BY", "SUPERSEDED_BY"]);
    expect(contract.doctrine.deterministic_ordering_keys).toEqual(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "lineage_id"]);
    expect(contract.doctrine.mutation_permitted).toBe(false);
    expect(contract.doctrine.repair_permitted).toBe(false);
  });

  it("returns deterministic lineage relationships and index entries", () => {
    const response = runAutonomyLineageSearch();

    expect(response.phase_version).toBe("8I.7");
    expect(response.search_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.lineage_records.length).toBe(10);
    expect(response.lineage_index.length).toBe(10);
    expect(response.lineage_records[0].source_object_type).toBe("OBJECTIVE");
    expect(response.lineage_records[0].target_object_type).toBe("PLAN");
    expect(response.lineage_records.map((record) => record.relationship_type)).toContain("VERIFIED_BY");
    expect(response.audit_record.authorization_result).toBe("APPROVED");
    expect(response.result_hash).toBeTruthy();
  });

  it("repeats identical lineage searches with identical hashes", () => {
    const first = runAutonomyLineageSearch();
    const second = runAutonomyLineageSearch();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.lineage_records.map((record) => record.lineage_hash)).toEqual(first.lineage_records.map((record) => record.lineage_hash));
    expect(second.lineage_index.map((entry) => entry.index_hash)).toEqual(first.lineage_index.map((entry) => entry.index_hash));
  });

  it("builds an influence chain from objective through integrity verification", () => {
    const response = runAutonomyLineageSearch({ scenario: "INFLUENCE_CHAIN" });

    expect(response.search_type).toBe("INFLUENCE_CHAIN");
    expect(response.influence_chain?.nodes[0].object_type).toBe("OBJECTIVE");
    expect(response.influence_chain?.nodes.at(-1)?.object_type).toBe("INTEGRITY");
    expect(response.influence_chain?.relationships.length).toBe(response.lineage_records.length);
    expect(response.influence_chain?.replay_reference).toBe(response.replay_reference);
  });

  it("supports reference index and relationship-only views", () => {
    const index = runAutonomyLineageSearch({ scenario: "REFERENCE_INDEX" });
    const relationships = runAutonomyLineageSearch({ scenario: "RELATIONSHIP_LOOKUP" });

    expect(index.search_type).toBe("REFERENCE_INDEX");
    expect(index.lineage_index.every((entry) => entry.parent_reference && entry.child_reference)).toBe(true);
    expect(index.influence_chain).toBeNull();
    expect(relationships.search_type).toBe("RELATIONSHIP_LOOKUP");
    expect(relationships.lineage_records.length).toBeGreaterThan(0);
  });

  it("detects broken lineage without repair", () => {
    const response = runAutonomyLineageSearch({ scenario: "BROKEN_LINEAGE" });

    expect(response.search_state).toBe("BROKEN_LINEAGE");
    expect(response.broken_lineage_findings.map((finding) => finding.finding_type)).toEqual(["MISSING_LINEAGE", "ORPHANED_HISTORY"]);
    expect(response.broken_lineage_findings.every((finding) => finding.repair_attempted === false)).toBe(true);
    expect(response.audit_record.authorization_result).toBe("APPROVED");
  });

  it.each([
    ["LINEAGE_NOT_FOUND", "LINEAGE_NOT_FOUND"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE"],
    ["ORPHANED_REFERENCE", "ORPHANED_REFERENCE"],
    ["CIRCULAR_REFERENCE", "CIRCULAR_REFERENCE"],
    ["INVALID_RELATIONSHIP", "INVALID_RELATIONSHIP"],
    ["INVALID_REPLAY_REFERENCE", "INVALID_REPLAY_REFERENCE"],
    ["INVALID_INTEGRITY_REFERENCE", "INVALID_INTEGRITY_REFERENCE"],
    ["MISSION_NOT_FOUND", "MISSION_NOT_FOUND"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["MUTATION_ATTEMPT", "VALIDATION_FAILURE"],
  ] as readonly [AutonomyLineageSearchScenario, AutonomyLineageSearchErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runAutonomyLineageSearch({ scenario });
      const validation = validateAutonomyLineageSearch({ scenario });

      expect(response.search_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe(["BROKEN_LINEAGE", "ORPHANED_REFERENCE", "CIRCULAR_REFERENCE", "INVALID_RELATIONSHIP", "INVALID_REPLAY_REFERENCE", "INVALID_INTEGRITY_REFERENCE", "ORDERING_FAILURE"].includes(state) ? "APPROVED" : "REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for lineage failures", () => {
    const surface = buildAutonomyLineageSearchObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.search_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.relationship_count).toBe(0);
    expect(surface.audit_hash).toBeTruthy();
  });
});
