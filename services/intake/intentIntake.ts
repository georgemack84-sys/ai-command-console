import { logger } from "@/src/server/observability/logger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { buildIntakeAuditRecord } from "./intakeAudit";
import { normalizeInput } from "./inputNormalization";
import { resolveIntakeFailure, shouldRequireIsolationReview, isAllowedIntakeSource } from "./intakePolicies";
import { validateNormalizedIntentEnvelope } from "./intakeValidation";
import type { NormalizedIntentEnvelope } from "@/types/intent/NormalizedIntentEnvelope";
import type { IntakeFailureType } from "@/types/intent/IntakeFailureType";

type IntakeMetrics = {
  acceptedRequests: number;
  rejectedRequests: number;
  normalizationFailures: number;
  validationFailures: number;
  safetyRejections: number;
  averageNormalizationTime: number;
};

type IntakeResult = {
  state: "RECEIVED" | "NORMALIZED" | "VALIDATED" | "REJECTED" | "ACCEPTED" | "FORWARDED" | "FAILED";
  envelope: NormalizedIntentEnvelope;
  forwarded: boolean;
  failureType?: IntakeFailureType;
  blockedReasons: string[];
  metrics: IntakeMetrics;
  audit: ReturnType<typeof buildIntakeAuditRecord>;
};

function buildRequestId(input: {
  source: string;
  rawInput: unknown;
  metadata: NormalizedIntentEnvelope["metadata"];
  receivedAt: number;
}) {
  return `intent:${hashEvidence(input).slice(0, 16)}`;
}

function redactMetadata(metadata: NormalizedIntentEnvelope["metadata"]) {
  return {
    sessionId: metadata.sessionId ? "present" : "absent",
    userId: metadata.userId ? "present" : "absent",
    correlationId: metadata.correlationId ? "present" : "absent",
    parentRequestId: metadata.parentRequestId ? "present" : "absent",
  };
}

export function intakeIntentRequest(input: {
  source: string;
  rawInput: unknown;
  metadata?: NormalizedIntentEnvelope["metadata"];
  receivedAt?: number;
}): IntakeResult {
  const receivedAt = input.receivedAt ?? 0;
  const metadata = input.metadata ?? {};
  const requestId = buildRequestId({
    source: input.source,
    rawInput: input.rawInput,
    metadata,
    receivedAt,
  });

  logger.info("Intent intake received", {
    requestId,
    source: input.source,
    metadata: redactMetadata(metadata),
  });

  try {
    const { normalizedInput, inspection } = normalizeInput(input.rawInput);
    const validation = validateNormalizedIntentEnvelope({
      source: input.source,
      receivedAt,
      rawInput: input.rawInput,
      normalizedInput,
      metadata,
    });
    const failureType = resolveIntakeFailure({
      sourceValid: isAllowedIntakeSource(input.source),
      inspection,
      validationFailed: !validation.valid,
    });

    const rejected = failureType !== null;
    const rejectionReason = rejected ? failureType : undefined;
    const containsExecutableContent = inspection.containsShellContent || inspection.containsScriptContent;

    const envelope: NormalizedIntentEnvelope = {
      requestId,
      source: isAllowedIntakeSource(input.source) ? input.source : "system",
      receivedAt,
      rawInput: input.rawInput,
      normalizedInput,
      metadata,
      safety: {
        containsExecutableContent,
        requiresIsolationReview: shouldRequireIsolationReview(inspection),
        rejected,
        rejectionReason,
      },
    };

    const state = rejected ? "REJECTED" : "FORWARDED";
    const audit = buildIntakeAuditRecord({
      requestId,
      source: input.source,
      state,
      failureType: rejectionReason,
      rejectionReason,
      safety: inspection,
      normalizationSummary: {
        hasText: Boolean(normalizedInput.text),
        hasStructuredPayload: Boolean(normalizedInput.structuredPayload),
      },
      metadata,
      receivedAt,
    });

    logger.info("Intent intake completed", {
      requestId,
      state,
      rejected,
      safetyFlags: inspection,
      blockedReasons: validation.reasons,
    });

    return {
      state,
      envelope,
      forwarded: !rejected,
      failureType: rejectionReason,
      blockedReasons: validation.reasons,
      metrics: {
        acceptedRequests: rejected ? 0 : 1,
        rejectedRequests: rejected ? 1 : 0,
        normalizationFailures: 0,
        validationFailures: validation.valid ? 0 : 1,
        safetyRejections: failureType === "SAFETY_REJECTION" ? 1 : 0,
        averageNormalizationTime: 0,
      },
      audit,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "intake_unknown_failure";
    const failureType: IntakeFailureType =
      message === "intake_recursion_limit_exceeded"
        ? "RECURSION_LIMIT_EXCEEDED"
        : "NORMALIZATION_FAILURE";

    const envelope: NormalizedIntentEnvelope = {
      requestId,
      source: isAllowedIntakeSource(input.source) ? input.source : "system",
      receivedAt,
      rawInput: input.rawInput,
      normalizedInput: {},
      metadata,
      safety: {
        containsExecutableContent: false,
        requiresIsolationReview: true,
        rejected: true,
        rejectionReason: failureType,
      },
    };

    const audit = buildIntakeAuditRecord({
      requestId,
      source: input.source,
      state: "FAILED",
      failureType,
      rejectionReason: failureType,
      safety: {
        containsShellContent: false,
        containsScriptContent: false,
        containsBinaryData: false,
        containsRecursivePayload: failureType === "RECURSION_LIMIT_EXCEEDED",
        exceedsLimits: false,
        malformedEncoding: false,
      },
      normalizationSummary: {
        hasText: false,
        hasStructuredPayload: false,
      },
      metadata,
      receivedAt,
    });

    logger.warn("Intent intake failed", {
      requestId,
      failureType,
      metadata: redactMetadata(metadata),
    });

    return {
      state: "FAILED",
      envelope,
      forwarded: false,
      failureType,
      blockedReasons: [failureType],
      metrics: {
        acceptedRequests: 0,
        rejectedRequests: 1,
        normalizationFailures: 1,
        validationFailures: 0,
        safetyRejections: 0,
        averageNormalizationTime: 0,
      },
      audit,
    };
  }
}
