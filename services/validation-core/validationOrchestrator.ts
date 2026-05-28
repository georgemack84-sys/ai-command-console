import type {
  ValidationStatus,
  ValidatorName,
  ValidatorResult,
  ValidationTimelineResult,
} from "@/types/validation-core";
import { createValidationTruthLedger, appendValidationTruthEvent, readValidationTruthEvents } from "./validationTruthLedger";
import { emitValidationEvent } from "./validationEventEmitter";
import { validateSchema } from "./schemaValidator";
import { validateDependencies } from "./dependencyValidator";
import { validateCapabilities } from "./capabilityValidator";
import { validateGovernance } from "./governanceValidator";
import { validateReplay } from "./replayValidator";
import { validateRollback } from "./rollbackValidator";
import { validateRuntimeCompatibility } from "./runtimeValidator";
import { validateIsolation } from "./isolationValidator";
import { validateIntegrity } from "./integrityValidator";
import { buildEventIntegrityChain, verifyEventIntegrityChain } from "./validationEventIntegrity";
import { buildReplaySafeValidationTimeline } from "./validationReplayTimeline";
import { resolveValidationCausality } from "./validationCausalityResolver";
import { reconstructValidationState } from "./validationStateReconstructor";
import { analyzeValidationForensics } from "./validationForensicsEngine";
import type { ValidationContext, ValidationFailure, ValidationPipelineOutput, ValidatorDefinition } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

const VALIDATORS: readonly ValidatorDefinition[] = [
  { name: "schema", subsystem: "validation-core", implementation: validateSchema },
  { name: "dependency", subsystem: "validation-core", implementation: validateDependencies },
  { name: "capability", subsystem: "validation-core", implementation: validateCapabilities },
  { name: "governance", subsystem: "validation-core", implementation: validateGovernance },
  { name: "replay", subsystem: "validation-core", implementation: validateReplay },
  { name: "rollback", subsystem: "validation-core", implementation: validateRollback },
  { name: "runtime", subsystem: "validation-core", implementation: validateRuntimeCompatibility },
  { name: "isolation", subsystem: "validation-core", implementation: validateIsolation },
  { name: "integrity", subsystem: "validation-core", implementation: validateIntegrity },
] as const;

function statusFromFailures(
  treatyStatus: ValidationContext["treaty"]["manifest"]["handoffStatus"],
  revocationStatus: ValidationContext["treaty"]["manifest"]["preExecutionRevocationStatus"],
  failures: readonly ValidationFailure[],
): ValidationStatus {
  if (treatyStatus === "quarantined" || revocationStatus === "quarantined") {
    return "quarantined";
  }
  if (treatyStatus === "revalidation-required" || revocationStatus === "must_revalidate" || failures.some((failure) => failure.code === "VALIDATION_ROLLBACK_UNSAFE")) {
    return "revalidation-required";
  }
  if (failures.some((failure) => failure.code === "VALIDATION_INTEGRITY_FAILURE" || failure.code === "VALIDATION_EVENT_CORRUPTION")) {
    return "invalid";
  }
  if (failures.some((failure) => failure.code === "VALIDATION_TIMELINE_GAP" || failure.code === "VALIDATION_EVENT_AMBIGUITY" || failure.code === "VALIDATION_CAUSALITY_BROKEN" || failure.code === "VALIDATION_REPLAY_DIVERGENCE")) {
    return "disputed";
  }
  if (failures.length > 0) {
    return "denied";
  }
  return "approved";
}

export function orchestrateValidation(context: ValidationContext): ValidationPipelineOutput {
  let sequence = 1;
  let ledger = createValidationTruthLedger();
  const failures: ValidationFailure[] = [];
  const validatorResults = {} as Record<ValidatorName, ValidatorResult>;

  const rootStarted = emitValidationEvent(context, {
    eventType: "validation.started",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    subsystem: "validation-core",
    severity: "info",
    payload: { targetType: context.request.targetType, targetId: context.request.targetId },
  });
  ledger = appendValidationTruthEvent(ledger, rootStarted);

  for (const validator of VALIDATORS) {
    sequence += 1;
    ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
      eventType: `${validator.name}.validation.started`,
      timestamp: context.request.submittedAt,
      monotonicSequence: sequence,
      parentEventId: rootStarted.eventId,
      rootEventId: rootStarted.eventId,
      validator: validator.name,
      subsystem: validator.subsystem,
      severity: "info",
    }));

    const outcome = validator.implementation(context);
    validatorResults[validator.name] = outcome.result;
    failures.push(...outcome.failures);

    sequence += 1;
    ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
      eventType: `${validator.name}.validation.${outcome.result.passed ? "passed" : "failed"}`,
      timestamp: context.request.submittedAt,
      monotonicSequence: sequence,
      parentEventId: rootStarted.eventId,
      rootEventId: rootStarted.eventId,
      validator: validator.name,
      subsystem: validator.subsystem,
      severity: outcome.result.passed ? "info" : "error",
      payload: outcome.result,
    }));
  }

  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: "forensics.analysis.started",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: "info",
  }));

  const allEvents = readValidationTruthEvents(ledger);
  const forensics = analyzeValidationForensics({
    validationId: context.request.validationId,
    events: allEvents,
    failures,
  });

  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: failures.length === 0 ? "forensics.analysis.completed" : "forensics.analysis.failed",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: failures.length === 0 ? "info" : "warn",
    payload: forensics,
  }));

  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: "timeline.reconstruction.started",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: "info",
  }));

  const eventIntegrity = buildEventIntegrityChain(readValidationTruthEvents(ledger));
  const integrityVerification = verifyEventIntegrityChain(readValidationTruthEvents(ledger), eventIntegrity);
  if (!integrityVerification.valid && integrityVerification.failureCode) {
    failures.push({
      code: integrityVerification.failureCode,
      message: "event integrity verification failed",
      path: "eventIntegrity",
    });
  }

  const provisionalState = reconstructValidationState({
    events: readValidationTruthEvents(ledger),
    failures,
  });
  const timelineBuild = buildReplaySafeValidationTimeline({
    treaty: context.treaty,
    validationId: context.request.validationId,
    events: readValidationTruthEvents(ledger),
    generatedAt: context.request.submittedAt,
    reconstructedStateHash: provisionalState.stateHash,
  });
  failures.push(...timelineBuild.failures);

  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: timelineBuild.timeline ? "timeline.reconstruction.completed" : "timeline.reconstruction.failed",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: timelineBuild.timeline ? "info" : "error",
    payload: timelineBuild.timeline ?? timelineBuild.failures,
  }));

  const causality = resolveValidationCausality(readValidationTruthEvents(ledger));
  if (!causality.valid && causality.failureCode) {
    failures.push({
      code: causality.failureCode,
      message: "validation event causality is broken",
      path: "events",
    });
  } else if (readValidationTruthEvents(ledger).length > 0) {
    sequence += 1;
    ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
      eventType: "causality.link.detected",
      timestamp: context.request.submittedAt,
      monotonicSequence: sequence,
      parentEventId: rootStarted.eventId,
      rootEventId: rootStarted.eventId,
      subsystem: "validation-core",
      severity: "debug",
      payload: causality,
    }));
  }

  const finalState = reconstructValidationState({
    events: readValidationTruthEvents(ledger),
    failures,
  });
  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: "forensic.state.rebuilt",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: "debug",
    payload: { stateHash: finalState.stateHash },
  }));

  const finalStatus = statusFromFailures(
    context.treaty.manifest.handoffStatus,
    context.treaty.manifest.preExecutionRevocationStatus,
    failures,
  );

  sequence += 1;
  ledger = appendValidationTruthEvent(ledger, emitValidationEvent(context, {
    eventType: finalStatus === "approved" ? "validation.completed" : "validation.failed",
    timestamp: context.request.submittedAt,
    monotonicSequence: sequence,
    parentEventId: rootStarted.eventId,
    rootEventId: rootStarted.eventId,
    subsystem: "validation-core",
    severity: finalStatus === "approved" ? "info" : "critical",
    payload: { status: finalStatus, failureCodes: failures.map((failure) => failure.code) },
  }));

  const timeline = timelineBuild.timeline ?? {
    timelineId: hashValidationCoreValue("validation-timeline-fallback", context.request.validationId),
    validationId: context.request.validationId,
    rootEventId: rootStarted.eventId,
    events: Object.freeze(readValidationTruthEvents(ledger).map((event) => event.eventId)),
    reconstructedStateHash: finalState.stateHash,
    deterministic: false,
    generatedAt: context.request.submittedAt,
    timelineHash: hashValidationCoreValue("validation-timeline-fallback", readValidationTruthEvents(ledger).map((event) => event.eventId)),
  };

  const result: ValidationTimelineResult = Object.freeze({
    validationId: context.request.validationId,
    status: finalStatus,
    deterministic: failures.every((failure) => failure.code !== "VALIDATION_DETERMINISM_FAILURE"),
    timelineId: timeline.timelineId,
    reconstructedStateHash: finalState.stateHash,
    validators: validatorResults,
    generatedAt: context.request.submittedAt,
    resultHash: hashValidationCoreValue("validation-result", {
      validationId: context.request.validationId,
      status: finalStatus,
      validators: validatorResults,
      reconstructedStateHash: finalState.stateHash,
      timelineId: timeline.timelineId,
      failureCodes: failures.map((failure) => failure.code),
    }),
  });

  return Object.freeze({
    result,
    timeline,
    events: Object.freeze(readValidationTruthEvents(ledger)),
    eventIntegrity: Object.freeze(buildEventIntegrityChain(readValidationTruthEvents(ledger))),
    forensics,
  });
}
