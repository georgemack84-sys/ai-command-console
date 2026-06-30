import { describe, expect, it } from "vitest";
import {
  buildAutonomyCrossReferenceSearchObservabilitySurface,
  getAutonomyCrossReferenceSearchContract,
  runAutonomyCrossReferenceSearch,
  validateAutonomyCrossReferenceSearch,
} from "@/services/autonomy-cross-reference-search";
import type { AutonomyCrossReferenceErrorState, AutonomyCrossReferenceScenario } from "@/types/autonomy-cross-reference-search";

describe("Mission Control Phase 8I.8 Autonomy Cross-Reference Search", () => {
  it("defines the read-only cross-reference doctrine", () => {
    const contract = getAutonomyCrossReferenceSearchContract();

    expect(contract.doctrine.schema_version).toBe("autonomy-cross-reference-search/v8I.8");
    expect(contract.doctrine.principles).toContain("cross-ledger");
    expect(contract.doctrine.search_types).toContain("CROSS_LEDGER_VIEW");
    expect(contract.doctrine.relationship_types).toContain("ROLLBACK_RECOMMENDED_BY");
    expect(contract.doctrine.reference_statuses).toEqual(["VALID", "STALE", "MISSING", "CONFLICTING", "UNAUTHORIZED", "INVALID"]);
    expect(contract.doctrine.deterministic_ordering_keys).toEqual(["tenant_id", "mission_id", "ledger_source", "source_record_type", "source_record_id", "relationship_type", "target_record_type", "target_record_id"]);
    expect(contract.doctrine.mutation_permitted).toBe(false);
    expect(contract.doctrine.repair_permitted).toBe(false);
  });

  it("returns deterministic cross-reference records, index entries, resolver results, and viewer rows", () => {
    const response = runAutonomyCrossReferenceSearch();

    expect(response.phase_version).toBe("8I.8");
    expect(response.search_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.cross_reference_records.length).toBe(10);
    expect(response.cross_reference_index.length).toBe(10);
    expect(response.resolver_results.every((resolver) => resolver.reference_status === "VALID")).toBe(true);
    expect(response.viewer_rows.length).toBe(10);
    expect(response.cross_reference_records.map((record) => `${record.source_record_type}->${record.target_record_type}`)).toContain("REPLAY->INTEGRITY");
    expect(response.audit_record.authorization_result).toBe("APPROVED");
    expect(response.result_hash).toBeTruthy();
  });

  it("repeats identical searches with identical hashes", () => {
    const first = runAutonomyCrossReferenceSearch();
    const second = runAutonomyCrossReferenceSearch();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.cross_reference_records.map((record) => record.cross_reference_hash)).toEqual(first.cross_reference_records.map((record) => record.cross_reference_hash));
    expect(second.cross_reference_index.map((entry) => entry.index_hash)).toEqual(first.cross_reference_index.map((entry) => entry.index_hash));
  });

  it("composes with autonomy lineage search evidence", () => {
    const response = runAutonomyCrossReferenceSearch();

    expect(response.lineage_response?.phase_version).toBe("8I.7");
    expect(response.lineage_response?.lineage_records.length).toBeGreaterThan(0);
    expect(response.cross_reference_records.every((record) => record.replay_reference === response.replay_reference)).toBe(true);
    expect(response.cross_reference_records.every((record) => record.lineage_reference.startsWith(response.lineage_reference))).toBe(true);
  });

  it("detects stale, missing, and conflicting references without repair", () => {
    const stale = runAutonomyCrossReferenceSearch({ scenario: "STALE_REFERENCE" });
    const missing = runAutonomyCrossReferenceSearch({ scenario: "MISSING_REFERENCE" });
    const conflict = runAutonomyCrossReferenceSearch({ scenario: "CONFLICTING_REFERENCE" });

    expect(stale.cross_reference_records.some((record) => record.reference_status === "STALE" && record.stale_reference_reason === "SUPERSEDED_PLAN")).toBe(true);
    expect(missing.cross_reference_records.some((record) => record.reference_status === "MISSING")).toBe(true);
    expect(missing.missing_references.every((record) => record.repair_attempted === false)).toBe(true);
    expect(conflict.cross_reference_records.some((record) => record.reference_status === "CONFLICTING")).toBe(true);
    expect(conflict.conflicts.length).toBeGreaterThan(0);
  });

  it("supports resolver, conflict detector, missing detector, and cross-ledger viewer modes", () => {
    const resolver = runAutonomyCrossReferenceSearch({ scenario: "REFERENCE_RESOLUTION" });
    const conflict = runAutonomyCrossReferenceSearch({ scenario: "CONFLICT_DETECTION" });
    const missing = runAutonomyCrossReferenceSearch({ scenario: "MISSING_REFERENCE_DETECTION" });
    const viewer = runAutonomyCrossReferenceSearch({ scenario: "CROSS_LEDGER_VIEW" });

    expect(resolver.search_type).toBe("REFERENCE_RESOLUTION");
    expect(resolver.resolver_results.length).toBe(10);
    expect(conflict.search_type).toBe("CONFLICT_DETECTION");
    expect(conflict.conflicts).toEqual([]);
    expect(missing.search_type).toBe("MISSING_REFERENCE_DETECTION");
    expect(missing.missing_references.length).toBe(2);
    expect(viewer.search_type).toBe("CROSS_LEDGER_VIEW");
    expect(viewer.viewer_rows[0].governance_reference).toBe("governance:cross-reference:8i8");
  });

  it.each([
    ["SOURCE_RECORD_NOT_FOUND", "SOURCE_RECORD_NOT_FOUND"],
    ["TARGET_RECORD_NOT_FOUND", "TARGET_RECORD_NOT_FOUND"],
    ["STALE_REFERENCE", "STALE_REFERENCE"],
    ["MISSING_REFERENCE", "MISSING_REFERENCE"],
    ["CONFLICTING_REFERENCE", "CONFLICTING_REFERENCE"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["CROSS_TENANT_LINK_REJECTED", "CROSS_TENANT_LINK_REJECTED"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["INTEGRITY_REFERENCE_INVALID", "INTEGRITY_REFERENCE_INVALID"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["MUTATION_ATTEMPT", "INVALID_CROSS_REFERENCE_QUERY"],
  ] as readonly [AutonomyCrossReferenceScenario, AutonomyCrossReferenceErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runAutonomyCrossReferenceSearch({ scenario });
      const validation = validateAutonomyCrossReferenceSearch({ scenario });

      expect(response.search_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe(["TARGET_RECORD_NOT_FOUND", "STALE_REFERENCE", "MISSING_REFERENCE", "CONFLICTING_REFERENCE", "CROSS_TENANT_LINK_REJECTED", "REPLAY_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID", "INTEGRITY_REFERENCE_INVALID", "ORDERING_FAILURE"].includes(state) ? "APPROVED" : "REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for cross-reference failures", () => {
    const surface = buildAutonomyCrossReferenceSearchObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.search_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.reference_count).toBe(0);
    expect(surface.audit_hash).toBeTruthy();
  });
});
