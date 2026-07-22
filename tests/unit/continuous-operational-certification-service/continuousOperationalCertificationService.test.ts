import { describe, expect, it } from "vitest";
import {
  getContinuousOperationalCertificationServiceBundle,
  replayContinuousOperationalCertificationService,
  runContinuousOperationalCertificationService,
  validateContinuousOperationalCertificationService,
} from "@/services/continuous-operational-certification-service";
import type { ContinuousOperationalCertificationFailure, ContinuousOperationalCertificationResult } from "@/types/continuous-operational-certification-service";

const failureScenarios: ContinuousOperationalCertificationFailure[] = [
  "CERTIFICATION_NOT_CONTINUOUSLY_EVALUATED",
  "CERTIFICATION_DECISIONS_NOT_DETERMINISTIC",
  "CERTIFICATION_LINEAGE_INCOMPLETE",
  "CERTIFICATION_HISTORY_MUTABLE",
  "QUALIFICATION_LOSS_NOT_IMMEDIATELY_DETECTED",
  "CONTINUOUS_EVIDENCE_COLLECTION_NOT_OPERATIONAL",
  "CERTIFICATION_DRIFT_NOT_DETERMINISTIC",
  "EXTERNAL_IMPLEMENTATION_ATTESTATIONS_NOT_VALIDATED",
  "ATTESTATION_LINEAGE_NOT_ADDITIVE",
  "SUPERSEDING_LINEAGE_NOT_VERIFIED",
  "OPERATIONAL_CHANGE_PROCESSING_NOT_DETERMINISTIC",
  "UNKNOWN_CHANGE_TYPES_NOT_FAIL_CLOSED",
  "SECURITY_CHANGES_NOT_ROUTED_TO_EXISTING_PIPELINE",
  "REPLAY_NOT_REPRODUCIBLE",
  "SERVICE_FAIL_CLOSED_NOT_VERIFIED",
  "CONTINUOUS_OPERATIONAL_CERTIFICATION_NOT_CERTIFIED",
  "GOVERNANCE_AUTHORITY_INTERNALIZED",
  "PHASE_18_6_QUALIFICATION_NOT_VALID",
];

describe("continuous operational certification service", () => {
  it("publishes the Phase 18.7 doctrine and validates the baseline bundle", () => {
    const bundle = getContinuousOperationalCertificationServiceBundle();

    expect(bundle.doctrine.version).toBe("continuous-operational-certification-service/v18.7");
    expect(bundle.doctrine.upstream_phase).toBe("adaptation-qualification-service/v18.6");
    expect(bundle.doctrine.lifecycle_states).toEqual([
      "OPERATIONAL_EVENT",
      "EVIDENCE_COLLECTION",
      "CERTIFICATION_EVALUATION",
      "QUALIFICATION_DECISION",
      "CERTIFICATION_EVENT",
      "LINEAGE_UPDATE",
      "CONTINUOUS_MONITORING",
    ]);
    expect(bundle.doctrine.event_types).toHaveLength(10);
    expect(bundle.doctrine.drift_classes).toHaveLength(8);
    expect(bundle.doctrine.change_types).toHaveLength(8);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("operates as a standing independent constitutional certification service", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.certification_engine.standing_constitutional_service).toBe(true);
    expect(result.certification_engine.lifecycle_independent).toBe(true);
    expect(result.certification_engine.deterministic_evaluation).toBe(true);
    expect(result.certification_engine.fail_closed).toBe(true);
    expect(result.certification_engine.governance_authority_external).toBe(true);
  });

  it("collects immutable continuous evidence and monitors certification health", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.evidence_collector.operational).toBe(true);
    expect(result.evidence_collector.immutable_collection).toBe(true);
    expect(result.evidence_collector.operational_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_collector.governance_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_collector.replay_evidence.length).toBeGreaterThan(0);
    expect(result.health_monitor.certification_freshness).toBe(true);
    expect(result.health_monitor.service_availability).toBe(true);
    expect(result.health_monitor.evidentiary_only).toBe(true);
  });

  it("detects drift deterministically and fails closed on unknown drift", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.drift_detector.drift_classes).toHaveLength(8);
    expect(result.drift_detector.drift_event_refs).toHaveLength(8);
    expect(result.drift_detector.deterministic_detection).toBe(true);
    expect(result.drift_detector.unknown_drift_fails_closed).toBe(true);
  });

  it("validates immutable external implementation attestations without assuming implementation", () => {
    const result = runContinuousOperationalCertificationService();
    const [attestation] = result.attestation_validator.attestations;

    expect(result.attestation_validator.implementation_not_assumed).toBe(true);
    expect(result.attestation_validator.invalidation_additive_lineage).toBe(true);
    expect(result.attestation_validator.historical_attestations_preserved).toBe(true);
    expect(result.attestation_validator.superseding_lineage_events.length).toBeGreaterThan(0);
    expect(attestation.signature_verified).toBe(true);
    expect(attestation.immutable).toBe(true);
    expect(attestation.disputed).toBe(false);
    expect(attestation.invalidated).toBe(false);
  });

  it("processes operational changes deterministically with unknown and security routing safeguards", () => {
    const result = runContinuousOperationalCertificationService();
    const unknown = result.change_processor.changes.find((change) => change.change_type === "UNKNOWN_REGISTERED");
    const security = result.change_processor.changes.find((change) => change.change_type === "SECURITY");

    expect(result.change_processor.registry_versioned).toBe(true);
    expect(result.change_processor.registry_immutable).toBe(true);
    expect(result.change_processor.deterministic_processing).toBe(true);
    expect(result.change_processor.unknown_changes_fail_closed).toBe(true);
    expect(result.change_processor.security_changes_route_existing_pipeline).toBe(true);
    expect(unknown?.fail_closed).toBe(true);
    expect(security?.security_pipeline_routed).toBe(true);
  });

  it("records immutable certification events, lineage, and ledger entries", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.event_registry.events).toHaveLength(10);
    expect(result.event_registry.qualification_loss_immediate).toBe(true);
    expect(result.event_registry.immutable_events).toBe(true);
    expect(result.lineage_manager.strictly_additive).toBe(true);
    expect(result.lineage_manager.history_immutable).toBe(true);
    expect(result.lineage_manager.supersession_events.length).toBeGreaterThan(0);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.integrity_verification).toBe(true);
    expect(result.ledger.certification_decisions).toHaveLength(10);
  });

  it("replays certification state and keeps observability non-mutating", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.replay_service.evaluations_replayed).toBe(true);
    expect(result.replay_service.evidence_collection_replayed).toBe(true);
    expect(result.replay_service.attestation_validation_replayed).toBe(true);
    expect(result.replay_service.fail_closed_replayed).toBe(true);
    expect(result.replay_service.identical_outcomes).toBe(true);
    expect(result.observability.replay_verification).toBe(true);
    expect(result.observability.state_modified).toBe(false);
  });

  it("certifies the Phase 18.7 exit criteria", () => {
    const result = runContinuousOperationalCertificationService();

    expect(result.certification_package.certification_continuously_evaluated).toBe(true);
    expect(result.certification_package.certification_decisions_deterministic).toBe(true);
    expect(result.certification_package.certification_lineage_complete).toBe(true);
    expect(result.certification_package.certification_history_immutable).toBe(true);
    expect(result.certification_package.qualification_loss_immediately_detected).toBe(true);
    expect(result.certification_package.continuous_evidence_collection_operational).toBe(true);
    expect(result.certification_package.certification_drift_detected_deterministically).toBe(true);
    expect(result.certification_package.external_implementation_attestations_validated).toBe(true);
    expect(result.certification_package.attestation_lineage_additive).toBe(true);
    expect(result.certification_package.superseding_lineage_verified).toBe(true);
    expect(result.certification_package.operational_change_processing_deterministic).toBe(true);
    expect(result.certification_package.unknown_change_types_fail_closed).toBe(true);
    expect(result.certification_package.security_changes_routed_to_existing_pipeline).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.service_fail_closed_behavior_verified).toBe(true);
    expect(result.certification_package.continuous_operational_certification_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(16);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runContinuousOperationalCertificationService();
    const second = runContinuousOperationalCertificationService();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousOperationalCertificationService(first).valid).toBe(true);
    expect(replayContinuousOperationalCertificationService(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runContinuousOperationalCertificationService({
      scenario: "NON_CONSTITUTIONAL_CERTIFICATION_WARNING",
    });
    const validation = validateContinuousOperationalCertificationService(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_CERTIFICATION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runContinuousOperationalCertificationService({ scenario });
    const validation = validateContinuousOperationalCertificationService(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runContinuousOperationalCertificationService();
    const tamperedLedger: ContinuousOperationalCertificationResult = {
      ...result,
      ledger: {
        ...result.ledger,
        immutable: false,
      },
    };
    const tamperedReplay: ContinuousOperationalCertificationResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const ledgerValidation = validateContinuousOperationalCertificationService(tamperedLedger);
    const replayValidation = validateContinuousOperationalCertificationService(tamperedReplay);

    expect(ledgerValidation.valid).toBe(false);
    expect(ledgerValidation.ledger_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
