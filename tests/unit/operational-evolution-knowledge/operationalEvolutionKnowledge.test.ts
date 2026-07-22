import { describe, expect, it } from "vitest";
import {
  getOperationalEvolutionKnowledgeBundle,
  replayOperationalEvolutionKnowledge,
  runOperationalEvolutionKnowledge,
  validateOperationalEvolutionKnowledge,
} from "@/services/operational-evolution-knowledge";
import type { OperationalEvolutionKnowledgeFailure, OperationalEvolutionKnowledgeResult } from "@/types/operational-evolution-knowledge";

const failureScenarios: OperationalEvolutionKnowledgeFailure[] = [
  "OPERATIONAL_EVOLUTION_NOT_DETERMINISTIC",
  "RECOMMENDATION_LINEAGE_INCOMPLETE",
  "CERTIFICATION_LINEAGE_NOT_PRESERVED",
  "IMPLEMENTATION_LINEAGE_NOT_VALIDATED",
  "LESSONS_LEARNED_NOT_GOVERNED",
  "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED",
  "HISTORICAL_EVIDENCE_NOT_IMMUTABLE",
  "ARCHIVE_INTEGRITY_NOT_VERIFIED",
  "REPLAY_NOT_REPRODUCIBLE",
  "LINEAGE_INCOMPLETE",
  "GOVERNANCE_NOT_PRESERVED",
  "HISTORICAL_AUDIT_INCOMPLETE",
  "OPERATIONAL_EVOLUTION_NOT_CERTIFIED",
  "HISTORICAL_RECORD_MUTATED",
  "SUPERSESSION_CHAIN_INVALID",
  "ARCHIVE_CORRUPTION_DETECTED",
  "PHASE_18_10_REPLAY_STABILITY_NOT_VALID",
];

describe("operational evolution knowledge preservation", () => {
  it("publishes the Phase 18.11 doctrine and validates the baseline bundle", () => {
    const bundle = getOperationalEvolutionKnowledgeBundle();

    expect(bundle.doctrine.version).toBe("operational-evolution-knowledge/v18.11");
    expect(bundle.doctrine.upstream_phase).toBe("replay-stability-integrity/v18.10");
    expect(bundle.doctrine.evolution_stages).toEqual(["QUALIFIED_RECOMMENDATION", "IMPLEMENTATION_ATTESTATION", "OPERATIONAL_VALIDATION", "OPERATIONAL_IMPROVEMENT_RECORD", "KNOWLEDGE_EXTRACTION", "EVIDENCE_PRESERVATION", "HISTORICAL_REPLAY"]);
    expect(bundle.doctrine.improvement_stages).toEqual(["CANDIDATE", "QUALIFIED", "RECOMMENDED", "IMPLEMENTED", "VALIDATED", "RECORDED", "ARCHIVED"]);
    expect(bundle.doctrine.registry_categories).toHaveLength(9);
    expect(bundle.doctrine.knowledge_categories).toHaveLength(9);
    expect(bundle.doctrine.evidence_categories).toHaveLength(9);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("records governed operational evolution with immutable lineage", () => {
    const result = runOperationalEvolutionKnowledge();
    const [record] = result.evolution_registry.evolution_records;

    expect(result.evolution_registry.deterministic_evolution).toBe(true);
    expect(result.evolution_registry.immutable_history).toBe(true);
    expect(result.evolution_registry.additive_corrections).toBe(true);
    expect(result.evolution_registry.governance_preserved).toBe(true);
    expect(record.immutable).toBe(true);
    expect(record.recommendation_ref).toBeTruthy();
    expect(record.qualification_ref).toBeTruthy();
    expect(record.implementation_attestation_ref).toBeTruthy();
    expect(record.validation_ref).toBeTruthy();
    expect(record.certification_refs.length).toBeGreaterThan(0);
    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.knowledge_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
  });

  it("maintains continuous improvement transitions and recommendation lineage", () => {
    const result = runOperationalEvolutionKnowledge();

    expect(result.improvement_ledger.stages).toHaveLength(7);
    expect(result.improvement_ledger.immutable_entries).toBe(true);
    expect(result.improvement_ledger.additive_lineage).toBe(true);
    expect(result.improvement_ledger.deterministic_transitions).toBe(true);
    expect(result.improvement_ledger.improvement_proposals.length).toBeGreaterThan(0);
    expect(result.improvement_ledger.qualification_results.length).toBeGreaterThan(0);
    expect(result.improvement_ledger.recommendation_lineage.length).toBeGreaterThan(0);
    expect(result.improvement_ledger.implementation_decisions.length).toBeGreaterThan(0);
    expect(result.improvement_ledger.implementation_outcomes.length).toBeGreaterThan(0);
    expect(result.improvement_ledger.supersession_history.length).toBeGreaterThan(0);
  });

  it("preserves operational knowledge without replacing historical evidence", () => {
    const result = runOperationalEvolutionKnowledge();

    expect(result.knowledge_registry.categories).toHaveLength(9);
    expect(result.knowledge_registry.additive_knowledge).toBe(true);
    expect(result.knowledge_registry.knowledge_never_replaces_evidence).toBe(true);
    expect(result.knowledge_registry.governed_lessons).toBe(true);
    expect(result.knowledge_registry.historical_context_preserved).toBe(true);
    expect(result.knowledge_registry.lessons_learned.length).toBeGreaterThan(0);
    expect(result.knowledge_registry.operational_patterns.length).toBeGreaterThan(0);
    expect(result.knowledge_registry.governance_observations.length).toBeGreaterThan(0);
    expect(result.knowledge_registry.replay_observations.length).toBeGreaterThan(0);
    expect(result.knowledge_registry.evidence_refs.length).toBeGreaterThan(0);
  });

  it("archives cryptographically verifiable replayable evidence", () => {
    const result = runOperationalEvolutionKnowledge();

    expect(result.evidence_archive.categories).toHaveLength(9);
    expect(result.evidence_archive.immutable_evidence).toBe(true);
    expect(result.evidence_archive.cryptographically_verifiable).toBe(true);
    expect(result.evidence_archive.replayable).toBe(true);
    expect(result.evidence_archive.archive_integrity_verified).toBe(true);
    expect(result.evidence_archive.qualification_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_archive.certification_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_archive.replay_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_archive.implementation_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_archive.audit_artifacts.length).toBeGreaterThan(0);
  });

  it("certifies the Phase 18.11 exit criteria", () => {
    const result = runOperationalEvolutionKnowledge();

    expect(result.certification_package.operational_evolution_deterministic).toBe(true);
    expect(result.certification_package.recommendation_lineage_complete).toBe(true);
    expect(result.certification_package.certification_lineage_preserved).toBe(true);
    expect(result.certification_package.implementation_lineage_validated).toBe(true);
    expect(result.certification_package.lessons_learned_governed).toBe(true);
    expect(result.certification_package.operational_knowledge_preserved).toBe(true);
    expect(result.certification_package.historical_evidence_immutable).toBe(true);
    expect(result.certification_package.archive_integrity_verified).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.lineage_complete).toBe(true);
    expect(result.certification_package.governance_preserved).toBe(true);
    expect(result.certification_package.historical_audit_complete).toBe(true);
    expect(result.certification_package.operational_evolution_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runOperationalEvolutionKnowledge();
    const second = runOperationalEvolutionKnowledge();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalEvolutionKnowledge(first).valid).toBe(true);
    expect(replayOperationalEvolutionKnowledge(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runOperationalEvolutionKnowledge({ scenario: "NON_CONSTITUTIONAL_EVOLUTION_WARNING" });
    const validation = validateOperationalEvolutionKnowledge(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_EVOLUTION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runOperationalEvolutionKnowledge({ scenario });
    const validation = validateOperationalEvolutionKnowledge(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runOperationalEvolutionKnowledge();
    const tamperedArchive: OperationalEvolutionKnowledgeResult = {
      ...result,
      evidence_archive: {
        ...result.evidence_archive,
        archive_integrity_verified: false,
      },
    };
    const tamperedReplay: OperationalEvolutionKnowledgeResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const archiveValidation = validateOperationalEvolutionKnowledge(tamperedArchive);
    const replayValidation = validateOperationalEvolutionKnowledge(tamperedReplay);

    expect(archiveValidation.valid).toBe(false);
    expect(archiveValidation.evidence_archive_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
