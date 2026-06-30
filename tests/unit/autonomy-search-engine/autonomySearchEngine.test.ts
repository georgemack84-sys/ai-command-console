import { describe, expect, it } from "vitest";
import { buildAutonomyQueryContract } from "@/services/autonomy-query-contract";
import {
  buildAutonomySearchObservabilitySurface,
  buildAutonomySearchRecords,
  computeAutonomySearchHash,
  getAutonomySearchEngineContract,
  runAutonomySearch,
  validateAutonomySearch,
} from "@/services/autonomy-search-engine";
import type { AutonomySearchErrorState, AutonomySearchScenario } from "@/types/autonomy-search-engine";

describe("Mission Control Phase 8I.2 Autonomy Search Engine", () => {
  it("defines deterministic autonomy search doctrine and supported domains", () => {
    const contract = getAutonomySearchEngineContract();

    expect(contract.doctrine.schema_version).toBe("autonomy-search-engine/v8I.2");
    expect(contract.doctrine.index_version).toBe("autonomy-search-index/v8I.2");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.supported_domains).toContain("INTEGRITY");
    expect(contract.doctrine.indexed_record_types).toContain("BOUNDARY_EVENT");
  });

  it("executes a read-only autonomy baseline search", () => {
    const response = runAutonomySearch();

    expect(response.phase_version).toBe("8I.2");
    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.result_count).toBeGreaterThan(0);
    expect(response.read_only).toBe(true);
    expect(response.validation.valid).toBe(true);
    expect(response.index_manifest.state).toBe("VERIFIED");
    expect(response.audit_record.returned_record_count).toBe(response.result_count);
    expect(response.results[0]?.lineage_reference).toBeTruthy();
    expect(response.results[0]?.replay_reference).toBeTruthy();
    expect(response.results[0]?.integrity_hash).toBeTruthy();
  });

  it("repeats identical searches with identical ordering and hashes", () => {
    const first = runAutonomySearch();
    const second = runAutonomySearch();

    expect(second.search_hash).toBe(first.search_hash);
    expect(computeAutonomySearchHash(first)).toBe(first.search_hash);
    expect(second.results.map((result) => result.record_id)).toEqual(first.results.map((result) => result.record_id));
    expect(second.replay_support.reconstruction_hash).toBe(first.replay_support.reconstruction_hash);
  });

  it("canonicalizes result order when source records are shuffled", () => {
    const contract = buildAutonomyQueryContract();
    const records = [...buildAutonomySearchRecords(contract)].reverse();
    const response = runAutonomySearch({ query_contract: contract, records, requested_domains: ["EXECUTION", "PLANNING"], search_terms: ["autonomy"] });

    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.results.map((result) => result.record_id)).toEqual(["plan:autonomy:8i2:001", "execution:autonomy:8i2:002"]);
    expect(response.replay_support.ranking_stable).toBe(true);
  });

  it("retrieves autonomy records by immutable identifier", () => {
    const response = runAutonomySearch({ scenario: "IDENTITY_SEARCH" });

    expect(response.optimizer_plan.filter_strategy).toBe("IMMUTABLE_IDENTIFIER_LOOKUP");
    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.result_count).toBe(1);
    expect(response.results[0]?.record_id).toBe("execution:autonomy:8i2:002");
  });

  it.each([
    ["EXECUTION_SEARCH", "CANONICAL_FILTER_SCAN"],
    ["REPLAY_SEARCH", "REPLAY_REFERENCE_LOOKUP"],
    ["LINEAGE_SEARCH", "LINEAGE_TRAVERSAL"],
  ] as const)("supports %s with replay-safe planning", (scenario, strategy) => {
    const response = runAutonomySearch({ scenario });

    expect(response.optimizer_plan.filter_strategy).toBe(strategy);
    expect(response.validation.valid).toBe(true);
    expect(response.optimizer_plan.replay_safe).toBe(true);
    expect(response.replay_support.source_query_hash).toBe(response.query_hash);
  });

  it("returns NO_RESULTS for deterministic empty result sets without treating them as failures", () => {
    const response = runAutonomySearch({ scenario: "NO_MATCHES" });
    const validation = validateAutonomySearch({ scenario: "NO_MATCHES" });

    expect(response.result_state).toBe("NO_RESULTS");
    expect(response.result_count).toBe(0);
    expect(response.failures).toEqual([]);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["INVALID_QUERY", "INVALID_QUERY"],
    ["INVALID_FILTER", "INVALID_FILTER"],
    ["INVALID_SCOPE", "OBJECT_NOT_FOUND"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["OBJECT_NOT_FOUND", "OBJECT_NOT_FOUND"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["INDEX_CORRUPTION", "INDEX_CORRUPTION"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["POLICY_REJECTION", "POLICY_REJECTION"],
    ["CONSTITUTIONAL_REJECTION", "CONSTITUTIONAL_REJECTION"],
    ["MUTATION_ATTEMPT", "INDEX_CORRUPTION"],
  ] as readonly [AutonomySearchScenario, AutonomySearchErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runAutonomySearch({ scenario });
      const validation = validateAutonomySearch({ scenario });

      expect(response.result_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator observability for search failures", () => {
    const surface = buildAutonomySearchObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.result_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.index_state).toBe("VERIFIED");
    expect(surface.search_hash).toBeTruthy();
  });
});
