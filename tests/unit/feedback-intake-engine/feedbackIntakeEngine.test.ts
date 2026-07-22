import { describe, expect, it } from "vitest";
import {
  getFeedbackIntakeEngineFoundation,
  replayFeedbackIntake,
  submitFeedbackIntake,
} from "@/services/feedback-intake-engine";
import type { FeedbackIntakeFailure, FeedbackIntakeScenario } from "@/types/feedback-intake-engine";

describe("Mission Control Phase 10.9.2 Feedback Intake Engine", () => {
  it("publishes the feedback intake engine foundation", () => {
    const foundation = getFeedbackIntakeEngineFoundation();

    expect(foundation.feedback_intake_engine_version).toBe("feedback-intake-engine/v1");
    expect(foundation.api_surface.submit_feedback).toBe("POST /feedback-intake-engine/submit");
    expect(foundation.api_surface.normalization_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.result.intake_decision).toBe("ACCEPTED");
  });

  it("accepts valid feedback deterministically", () => {
    const first = submitFeedbackIntake({ scenario: "BASELINE" });
    const second = submitFeedbackIntake({ scenario: "BASELINE" });

    expect(first.intake_id).toBe(second.intake_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.intake_decision).toBe("ACCEPTED");
    expect(first.queue_entry?.queue_name).toBe("feedback-normalization");
  });

  it("authenticates, authorizes, validates, registers replay, queues, and audits accepted feedback", () => {
    const result = submitFeedbackIntake();

    expect(result.authentication.status).toBe("AUTHENTICATED");
    expect(result.authorization.status).toBe("AUTHORIZED");
    expect(result.contract_validation.validation_state).toBe("ACCEPTED");
    expect(result.duplicate_status).toBe("UNIQUE");
    expect(result.replay_registration.replayable).toBe(true);
    expect(result.queue_entry).not.toBeNull();
    expect(result.audit_events.map((event) => event.event_type)).toEqual([
      "SUBMISSION_RECEIVED",
      "AUTHENTICATION",
      "AUTHORIZATION",
      "VALIDATION",
      "DUPLICATE_DETECTION",
      "REPLAY_REGISTRATION",
      "QUEUE_PLACEMENT",
    ]);
  });

  it("preserves evidence-only boundaries", () => {
    const result = submitFeedbackIntake();

    expect(result.evidence_only).toBe(true);
    expect(result.api_surface.analysis_supported).toBe(false);
    expect(result.api_surface.adaptation_generation_supported).toBe(false);
    expect(result.api_surface.production_mutation_supported).toBe(false);
    expect(result.immutable_request_preserved).toBe(true);
    expect(result.append_only_audit).toBe(true);
  });

  it("ignores exact duplicates and returns an existing reference", () => {
    const result = submitFeedbackIntake({ scenario: "EXACT_DUPLICATE" });

    expect(result.duplicate_status).toBe("EXACT_DUPLICATE");
    expect(result.intake_decision).toBe("IGNORED_DUPLICATE");
    expect(result.duplicate_reference).toContain("existing_");
    expect(result.queue_entry).toBeNull();
  });

  it("flags near duplicates for review while preserving both records", () => {
    const result = submitFeedbackIntake({ scenario: "NEAR_DUPLICATE" });

    expect(result.duplicate_status).toBe("NEAR_DUPLICATE");
    expect(result.intake_decision).toBe("FLAGGED_FOR_REVIEW");
    expect(result.queue_entry?.validation_status).toBe("FLAGGED_FOR_REVIEW");
  });

  it.each([
    ["ANONYMOUS", "ANONYMOUS_FEEDBACK"],
    ["INVALID_OPERATOR", "INVALID_OPERATOR"],
    ["UNAUTHORIZED_OPERATOR", "UNAUTHORIZED_OPERATOR"],
    ["MISSING_TENANT", "CROSS_TENANT_FEEDBACK"],
    ["MISSING_MISSION", "MISSING_MISSION_REFERENCE"],
    ["MISSING_DECISION", "MISSING_DECISION_REFERENCE"],
    ["MISSING_PACKAGE_REFERENCE", "MISSING_PACKAGE_REFERENCE"],
    ["MISSING_REPLAY_REFERENCE", "MISSING_REPLAY_LINEAGE"],
    ["INVALID_REPLAY_REFERENCE", "INVALID_REPLAY_REFERENCE"],
    ["INVALID_EVIDENCE_REFERENCE", "INVALID_EVIDENCE_REFERENCE"],
    ["DUPLICATE_IDENTIFIER", "DUPLICATE_IMMUTABLE_IDENTIFIER"],
    ["INVALID_SCHEMA_VERSION", "INVALID_SCHEMA_VERSION"],
    ["CORRUPTED_INTEGRITY_HASH", "CORRUPTED_INTEGRITY_HASH"],
    ["GOVERNANCE_METADATA_OMISSION", "GOVERNANCE_VIOLATION"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_FEEDBACK"],
  ] as readonly [FeedbackIntakeScenario, FeedbackIntakeFailure][])("rejects %s", (scenario, failure) => {
    const result = submitFeedbackIntake({ scenario });

    expect(result.failures).toContain(failure);
    expect(["REJECTED", "IGNORED_DUPLICATE"]).toContain(result.intake_decision);
    expect(result.queue_entry).toBeNull();
    expect(result.error_class).toBe("NON_RECOVERABLE");
  });

  it.each([
    ["QUEUE_UNAVAILABLE", "QUEUE_UNAVAILABLE"],
    ["TRANSIENT_SERVICE_TIMEOUT", "TRANSIENT_SERVICE_TIMEOUT"],
  ] as readonly [FeedbackIntakeScenario, FeedbackIntakeFailure][])("schedules deterministic retry for %s", (scenario, failure) => {
    const result = submitFeedbackIntake({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.intake_decision).toBe("RETRY_SCHEDULED");
    expect(result.error_class).toBe("RECOVERABLE");
    expect(result.retry_policy).toBe("DETERMINISTIC_BACKOFF");
  });

  it("replays intake output and detects tampering", () => {
    const result = submitFeedbackIntake({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFeedbackIntake(result)).toBe(true);
    expect(replayFeedbackIntake(tampered)).toBe(false);
  });
});
