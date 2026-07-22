import { describe, expect, it } from "vitest";
import {
  buildKnowledgeRepositoryObservabilitySurface,
  getKnowledgeRepositoryEvolutionLedger,
  listEvolutionLedgerEntries,
  listKnowledgeLineageGraph,
  listKnowledgeRepositoryAudits,
  listKnowledgeRepositoryRecords,
  queryKnowledgeRepository,
  storeKnowledgeRepository,
  validateKnowledgeRepository,
} from "@/services/knowledge-repository-evolution-ledger";
import type { KnowledgeRepositoryFailure, KnowledgeRepositoryScenario } from "@/types/knowledge-repository-evolution-ledger";

describe("knowledge repository evolution ledger", () => {
  it("publishes the deterministic repository ledger bundle", () => {
    const bundle = getKnowledgeRepositoryEvolutionLedger();

    expect(bundle.doctrine.engine_version).toBe("knowledge-repository-evolution-ledger/v8ALT.9.8");
    expect(bundle.doctrine.final_state).toBe("KNOWLEDGE_REPOSITORY_LEDGER_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.append_only).toBe(true);
    expect(bundle.repository.read_only_queries).toBe(true);
    expect(bundle.repository.activation_authorized).toBe(false);
    expect(bundle.repository.operator_approval_bypass_authorized).toBe(false);
    expect(bundle.repository.delete_authorized).toBe(false);
  });

  it("stores validation-ready knowledge as immutable inactive records", () => {
    const repository = storeKnowledgeRepository();

    expect(repository.final_state).toBe("KNOWLEDGE_REPOSITORY_STORED");
    expect(repository.records.length).toBeGreaterThan(0);
    expect(repository.records.every((record) => record.lifecycle_state === "READY_FOR_OPERATOR_APPROVAL")).toBe(true);
    expect(repository.records.every((record) => record.approval_state === "OPERATOR_APPROVAL_REQUIRED")).toBe(true);
    expect(repository.records.every((record) => record.activation_state === "INACTIVE")).toBe(true);
    expect(repository.records.every((record) => record.append_only && record.immutable)).toBe(true);
  });

  it("records deterministic append-only ledger and lineage projections", () => {
    const repository = storeKnowledgeRepository();

    expect(repository.ledger_entries.length).toBe(repository.records.length * 4);
    expect(repository.ledger_entries.map((entry) => entry.event_sequence)).toEqual(repository.ledger_entries.map((_, index) => index + 1));
    expect(repository.ledger_entries.every((entry) => entry.event_type !== "REPOSITORY_OPERATION_REJECTED")).toBe(true);
    expect(repository.lineage_graph.length).toBe(repository.records.length);
    expect(repository.lineage_graph.every((edge) => edge.evidence_chain.length > 0)).toBe(true);
    expect(repository.lineage_graph.every((edge) => edge.replay_reference.length > 0)).toBe(true);
  });

  it("lists and queries repository data read-only", () => {
    expect(listKnowledgeRepositoryRecords().length).toBeGreaterThan(0);
    expect(listEvolutionLedgerEntries().length).toBeGreaterThan(0);
    expect(listKnowledgeLineageGraph().length).toBeGreaterThan(0);
    expect(listKnowledgeRepositoryAudits().length).toBe(0);

    const query = queryKnowledgeRepository();
    expect(query.read_only_queries).toBe(true);
    expect(query.records.length).toBeGreaterThan(0);
  });

  it("is deterministic for identical validation inputs", () => {
    const first = storeKnowledgeRepository();
    const second = storeKnowledgeRepository();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.records.map((record) => record.knowledge_id)).toEqual(first.records.map((record) => record.knowledge_id));
    expect(second.ledger_entries.map((entry) => entry.ledger_entry_id)).toEqual(first.ledger_entries.map((entry) => entry.ledger_entry_id));
  });

  it("keeps repository entries tenant-isolated and non-authorizing", () => {
    const repository = storeKnowledgeRepository();

    expect(repository.records.every((record) => record.tenant_id === "tenant:alpha")).toBe(true);
    expect(repository.records.every((record) => !record.activation_authorized)).toBe(true);
    expect(repository.records.every((record) => !record.operator_approval_bypass_authorized)).toBe(true);
    expect(repository.records.every((record) => !record.historical_rewrite_authorized)).toBe(true);
    expect(repository.records.every((record) => !record.delete_authorized)).toBe(true);
  });

  it.each([
    ["DUPLICATE_IDENTIFIER", "DUPLICATE_IDENTIFIER_DETECTED"],
    ["MISSING_VALIDATION", "VALIDATION_MISSING"],
    ["MISSING_CERTIFICATION_ELIGIBILITY", "CERTIFICATION_ELIGIBILITY_MISSING"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_LINEAGE_DETECTED"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_CONFLICT", "AUTHORITY_CONFLICT_DETECTED"],
    ["CORRUPTED_VERSION", "CORRUPTED_VERSION_DETECTED"],
    ["OVERWRITE_ATTEMPT", "OVERWRITE_ATTEMPT_REJECTED"],
    ["DELETE_ATTEMPT", "DELETE_ATTEMPT_REJECTED"],
    ["HISTORICAL_REWRITE_ATTEMPT", "HISTORICAL_REWRITE_REJECTED"],
    ["ACTIVATION_ATTEMPT", "ACTIVATION_ATTEMPT_REJECTED"],
    ["APPROVAL_BYPASS_ATTEMPT", "APPROVAL_BYPASS_REJECTED"],
    ["CROSS_TENANT_ACCESS_ATTEMPT", "CROSS_TENANT_ACCESS_REJECTED"],
  ] satisfies [KnowledgeRepositoryScenario, KnowledgeRepositoryFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = storeKnowledgeRepository({ scenario });
    const validation = validateKnowledgeRepository(repository);

    expect(repository.final_state).toBe("KNOWLEDGE_REPOSITORY_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audit_records.some((record) => record.rejection_reason === failure)).toBe(true);
    expect(repository.ledger_entries.some((entry) => entry.event_type === "REPOSITORY_OPERATION_REJECTED")).toBe(true);
  });

  it("publishes repository observability", () => {
    const surface = buildKnowledgeRepositoryObservabilitySurface();

    expect(surface.final_state).toBe("KNOWLEDGE_REPOSITORY_STORED");
    expect(surface.record_count).toBeGreaterThan(0);
    expect(surface.ledger_count).toBe(surface.record_count * 4);
    expect(surface.lineage_edge_count).toBe(surface.record_count);
    expect(surface.audit_count).toBe(0);
    expect(surface.activation_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
