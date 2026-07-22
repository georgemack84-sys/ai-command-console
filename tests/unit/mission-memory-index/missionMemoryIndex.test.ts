import { describe, expect, it } from "vitest";
import {
  establishMissionMemoryIndex,
  getMissionMemoryIndex,
  replayMissionMemoryIndex,
} from "@/services/mission-memory-index";
import type {
  IndexGenerationStage,
  MemoryIndexFamily,
  MissionMemoryIndexFailure,
  MissionMemoryIndexScenario,
  RankingInput,
  SearchCapability,
} from "@/types/mission-memory-index";

describe("Mission Control Phase 10.13C Mission Memory Index", () => {
  const families: readonly MemoryIndexFamily[] = [
    "MISSION_INDEX",
    "CONTEXT_INDEX",
    "STRATEGY_INDEX",
    "RISK_INDEX",
    "CONFIDENCE_INDEX",
    "OPERATOR_INDEX",
    "GOVERNANCE_INDEX",
    "EVIDENCE_INDEX",
    "REPLAY_INDEX",
    "CERTIFICATION_INDEX",
  ];

  const pipeline: readonly IndexGenerationStage[] = [
    "VALIDATED_MEMORY",
    "SCHEMA_VALIDATION",
    "GOVERNANCE_VALIDATION",
    "ATTRIBUTE_EXTRACTION",
    "DETERMINISTIC_INDEX_GENERATION",
    "INDEX_VALIDATION",
    "MEMORY_INDEX_LEDGER",
  ];

  const capabilities: readonly SearchCapability[] = [
    "MISSION",
    "OBJECTIVE",
    "OPERATOR",
    "STRATEGY",
    "EVIDENCE",
    "GOVERNANCE",
    "CONFIDENCE",
    "RISK",
    "SIMULATION",
    "CERTIFICATION",
    "REPLAY",
    "PATTERN",
    "RECOMMENDATION",
  ];

  const rankingInputs: readonly RankingInput[] = [
    "MISSION_SIMILARITY",
    "EVIDENCE_QUALITY",
    "GOVERNANCE_RELEVANCE",
    "CONFIDENCE_CALIBRATION",
    "RISK_SIMILARITY",
    "STRATEGIC_ALIGNMENT",
    "REPLAY_COMPLETENESS",
    "CERTIFICATION_STATUS",
    "RECENCY",
    "HISTORICAL_EFFECTIVENESS",
  ];

  it("publishes the authoritative mission memory index contract", () => {
    const index = getMissionMemoryIndex();

    expect(index.mission_memory_index_version).toBe("mission-memory-index/v1");
    expect(index.supported_index_families).toEqual(families);
    expect(index.supported_search_capabilities).toEqual(capabilities);
    expect(index.api_surface.establish_index).toBe("POST /mission-memory-index/establish");
    expect(index.api_surface.retrieve_contract).toBe("GET /mission-memory-index/contract");
    expect(index.api_surface.hidden_indexes_supported).toBe(false);
    expect(index.api_surface.unauthorized_indexing_supported).toBe(false);
    expect(index.api_surface.unauthorized_search_supported).toBe(false);
    expect(index.api_surface.cross_tenant_search_supported).toBe(false);
    expect(index.api_surface.system_of_record).toBe(false);
    expect(index.result.index_identifier).toBe("MissionMemoryIndex");
    expect(index.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic entries, search results, replay, and integrity", () => {
    const first = establishMissionMemoryIndex();
    const second = establishMissionMemoryIndex();

    expect(first.index_entries.map((entry) => entry.integrity_hash)).toEqual(second.index_entries.map((entry) => entry.integrity_hash));
    expect(first.search_results.map((result) => result.integrity_hash)).toEqual(second.search_results.map((result) => result.integrity_hash));
    expect(first.index_ledger.map((entry) => entry.integrity_hash)).toEqual(second.index_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayMissionMemoryIndex(first)).toBe(true);
  });

  it("defines index families, generation pipeline, search capabilities, and ranking inputs", () => {
    const result = establishMissionMemoryIndex();

    expect(result.contract.index_families).toEqual(families);
    expect(result.generation_pipeline).toEqual(pipeline);
    expect(result.search_capabilities).toEqual(capabilities);
    expect(result.ranking_inputs).toEqual(rankingInputs);
    expect(result.contract.discovery_structure_only).toBe(true);
    expect(result.contract.store_remains_authoritative).toBe(true);
    expect(result.contract.explainable_retrieval_required).toBe(true);
  });

  it("indexes stored memory into searchable tenant-isolated entries", () => {
    const result = establishMissionMemoryIndex();

    expect(result.index_entries).toHaveLength(11);
    expect(result.index_entries.map((entry) => entry.index_family)).toEqual([
      "MISSION_INDEX",
      "CONTEXT_INDEX",
      "STRATEGY_INDEX",
      "RISK_INDEX",
      "CONFIDENCE_INDEX",
      "OPERATOR_INDEX",
      "GOVERNANCE_INDEX",
      "EVIDENCE_INDEX",
      "REPLAY_INDEX",
      "CERTIFICATION_INDEX",
      "MISSION_INDEX",
    ]);
    expect(result.index_entries.every((entry) => entry.index_id.startsWith("mmi_"))).toBe(true);
    expect(result.index_entries.every((entry) => entry.lifecycle_state === "SEARCHABLE")).toBe(true);
    expect(result.index_entries.every((entry) => entry.evidence_refs.length > 0)).toBe(true);
    expect(result.index_entries.every((entry) => entry.governance_refs.length > 0)).toBe(true);
    expect(result.index_entries.every((entry) => entry.replay_refs.length > 0)).toBe(true);
  });

  it("produces explainable deterministic search results", () => {
    const result = establishMissionMemoryIndex();

    expect(result.search_results).toHaveLength(11);
    expect(result.search_results.every((entry) => entry.deterministic_rank)).toBe(true);
    expect(result.search_results.every((entry) => entry.ranking_inputs.length === 10)).toBe(true);
    expect(result.search_results.every((entry) => entry.matched_capabilities.length === 13)).toBe(true);
    expect(result.search_results.every((entry) => entry.explanation.includes("matched mission"))).toBe(true);
    expect(result.search_results.every((entry) => entry.governance_authorized)).toBe(true);
    expect(result.search_results.every((entry) => entry.replay_available)).toBe(true);
    expect(result.search_results.every((entry) => entry.evidence_traceable)).toBe(true);
  });

  it("records append-only immutable memory index ledger events", () => {
    const result = establishMissionMemoryIndex();

    expect(result.index_ledger).toHaveLength(88);
    expect(result.index_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.index_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.index_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.index_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.index_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces discovery-only authority boundaries and governed visibility", () => {
    const result = establishMissionMemoryIndex();

    expect(result.store_remains_authoritative).toBe(true);
    expect(result.discovery_structure_only).toBe(true);
    expect(result.authority_expansion).toBe(false);
    expect(result.governed_visibility).toBe(true);
    expect(result.governed_search_ready).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.explainable).toBe(true);
  });

  it("publishes observability and performance metrics", () => {
    const metrics = establishMissionMemoryIndex().metrics;

    expect(metrics.indexed_memories).toBe(11);
    expect(metrics.indexing_throughput).toBe(11);
    expect(metrics.lookup_latency_ms).toBe(8);
    expect(metrics.rebuild_duration_ms).toBe(21);
    expect(metrics.deterministic_replay_success).toBe(1);
    expect(metrics.duplicate_index_prevention).toBe(true);
    expect(metrics.retrieval_accuracy).toBe(1);
    expect(metrics.authorization_failures).toBe(0);
    expect(metrics.tenant_isolation_violations).toBe(0);
    expect(metrics.index_growth).toBe(22);
  });

  it.each([
    ["STORE_UNAVAILABLE", "STORE_UNAVAILABLE"],
    ["NONDETERMINISTIC_INDEX", "NONDETERMINISTIC_INDEX_GENERATION"],
    ["UNAUTHORIZED_MEMORY", "UNAUTHORIZED_MEMORY_SEARCHABLE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["INDEX_CORRUPTION", "INDEX_CORRUPTION"],
    ["DUPLICATE_INDEX", "DUPLICATE_INDEX_CREATED"],
    ["NONDETERMINISTIC_LOOKUP", "NONDETERMINISTIC_LOOKUP_RESULTS"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["UNAUTHORIZED_INDEXING", "UNAUTHORIZED_INDEXING"],
    ["UNAUTHORIZED_SEARCH", "UNAUTHORIZED_SEARCH"],
    ["HIDDEN_INDEX", "HIDDEN_INDEX_CREATED"],
    ["INACTIVE_MEMORY", "INACTIVE_MEMORY_INDEXED"],
  ] as const)("rejects indexing for %s", (scenario: MissionMemoryIndexScenario, failure: MissionMemoryIndexFailure) => {
    const result = establishMissionMemoryIndex({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.indexed_memories).toBe(0);
    expect(replayMissionMemoryIndex(result)).toBe(true);
  });

  it("keeps invalid entries out of governed search readiness", () => {
    const result = establishMissionMemoryIndex({ scenario: "MISSING_REPLAY" });

    expect(result.index_entries.every((entry) => entry.lifecycle_state === "REJECTED")).toBe(true);
    expect(result.search_results).toHaveLength(0);
    expect(result.governed_search_ready).toBe(false);
  });

  it("detects nested index entry tampering", () => {
    const result = establishMissionMemoryIndex();
    const tampered = {
      ...result,
      index_entries: [
        {
          ...result.index_entries[0],
          tenant_id: "tenant-other",
        },
        ...result.index_entries.slice(1),
      ],
    };

    expect(replayMissionMemoryIndex(tampered)).toBe(false);
  });
});
