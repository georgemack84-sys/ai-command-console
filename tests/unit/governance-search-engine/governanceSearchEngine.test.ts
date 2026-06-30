import { describe, expect, it } from "vitest";
import { buildGovernanceQueryContract } from "@/services/governance-query-contract";
import {
  buildGovernanceSearchObservabilitySurface,
  buildGovernanceSearchRecords,
  computeGovernanceSearchHash,
  getGovernanceSearchEngineContract,
  runGovernanceSearch,
  validateGovernanceSearch,
} from "@/services/governance-search-engine";
import type { GovernanceSearchErrorState, GovernanceSearchScenario } from "@/types/governance-search-engine";

describe("Mission Control Phase 7J.2 Governance Search Engine", () => {
  it("defines deterministic governance search doctrine and supported domains", () => {
    const contract = getGovernanceSearchEngineContract();

    expect(contract.doctrine.schema_version).toBe("governance-search-engine/v7J.2");
    expect(contract.doctrine.index_version).toBe("governance-search-index/v7J.2");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.supported_domains).toEqual([
      "AUDIT",
      "CERTIFICATION",
      "COMPLIANCE",
      "ESCALATION",
      "EVIDENCE",
      "LINEAGE",
      "POLICY",
      "RECOMMENDATION",
      "REPLAY",
      "RISK",
      "TRUTH_LEDGER",
      "VIOLATION",
    ]);
    expect(contract.doctrine.error_states).toContain("INDEX_INCONSISTENT");
  });

  it("executes a read-only evidence-backed baseline search", () => {
    const response = runGovernanceSearch();

    expect(response.phase_version).toBe("7J.2");
    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.result_count).toBeGreaterThan(0);
    expect(response.read_only).toBe(true);
    expect(response.validation.valid).toBe(true);
    expect(response.index_manifest.state).toBe("VERIFIED");
    expect(response.audit_record.result_count).toBe(response.result_count);
    expect(response.results[0]?.evidence_refs.length).toBeGreaterThan(0);
    expect(response.results[0]?.lineage_refs.length).toBeGreaterThan(0);
    expect(response.results[0]?.replay_refs.length).toBeGreaterThan(0);
  });

  it("repeats identical searches with identical ordering and hashes", () => {
    const first = runGovernanceSearch();
    const second = runGovernanceSearch();

    expect(second.search_hash).toBe(first.search_hash);
    expect(computeGovernanceSearchHash(first)).toBe(first.search_hash);
    expect(second.results.map((result) => result.immutable_identifier)).toEqual(first.results.map((result) => result.immutable_identifier));
    expect(second.replay_support.reconstruction_hash).toBe(first.replay_support.reconstruction_hash);
  });

  it("canonicalizes ranking order even when source records are shuffled", () => {
    const contract = buildGovernanceQueryContract();
    const records = [...buildGovernanceSearchRecords(contract)].reverse();
    const response = runGovernanceSearch({ query_contract: contract, records, requested_domains: ["RECOMMENDATION", "POLICY"], search_terms: ["governance"] });

    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.results.map((result) => result.ledger_sequence)).toEqual([7001, 7002]);
    expect(response.replay_support.ranking_stable).toBe(true);
  });

  it("retrieves governance records by immutable identifier", () => {
    const response = runGovernanceSearch({ scenario: "EXACT_IDENTIFIER_LOOKUP" });

    expect(response.optimizer_plan.filter_strategy).toBe("IMMUTABLE_IDENTIFIER_LOOKUP");
    expect(response.result_state).toBe("RESULTS_GENERATED");
    expect(response.result_count).toBe(1);
    expect(response.results[0]?.immutable_identifier).toBe("governance:recommendation:7j2:002");
    expect(response.results[0]?.ranking_inputs.exact_identifier_match).toBe(true);
  });

  it.each([
    ["HISTORICAL_SEARCH", "HISTORICAL_RECONSTRUCTION"],
    ["LINEAGE_SEARCH", "LINEAGE_TRAVERSAL"],
    ["REPLAY_SEARCH", "REPLAY_REFERENCE_LOOKUP"],
  ] as const)("supports %s with replay-safe execution planning", (scenario, strategy) => {
    const response = runGovernanceSearch({ scenario });

    expect(response.optimizer_plan.filter_strategy).toBe(strategy);
    expect(response.validation.valid).toBe(true);
    expect(response.optimizer_plan.replay_safe).toBe(true);
    expect(response.replay_support.source_query_hash).toBe(response.query_hash);
  });

  it("returns NO_RESULTS for deterministic empty result sets without treating them as failures", () => {
    const response = runGovernanceSearch({ scenario: "NO_MATCHES" });
    const validation = validateGovernanceSearch({ scenario: "NO_MATCHES" });

    expect(response.result_state).toBe("NO_RESULTS");
    expect(response.result_count).toBe(0);
    expect(response.failures).toEqual([]);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["SEARCH_TARGET_NOT_FOUND", "SEARCH_TARGET_NOT_FOUND"],
    ["INVALID_QUERY", "INVALID_QUERY"],
    ["INVALID_FILTER", "INVALID_FILTER"],
    ["INVALID_SCOPE", "INVALID_SCOPE"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["INDEX_INCONSISTENT", "INDEX_INCONSISTENT"],
    ["NON_DETERMINISTIC_ORDERING", "INDEX_INCONSISTENT"],
    ["MUTATION_ATTEMPT", "INDEX_INCONSISTENT"],
  ] as readonly [GovernanceSearchScenario, GovernanceSearchErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runGovernanceSearch({ scenario });
      const validation = validateGovernanceSearch({ scenario });

      expect(response.result_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator observability for search failures", () => {
    const surface = buildGovernanceSearchObservabilitySurface({ scenario: "TENANT_ISOLATION_VIOLATION" });

    expect(surface.result_state).toBe("TENANT_ISOLATION_VIOLATION");
    expect(surface.errors).toContain("TENANT_ISOLATION_VIOLATION");
    expect(surface.index_state).toBe("VERIFIED");
    expect(surface.search_hash).toBeTruthy();
  });
});
