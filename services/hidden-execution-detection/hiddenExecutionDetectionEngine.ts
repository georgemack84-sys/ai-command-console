import { appendHiddenExecutionAuditEntry } from "./hiddenExecutionAuditLedger";
import { classifyHiddenExecutionSeverity } from "./hiddenExecutionSeverityClassifier";
import { detectDelayedInvocationPaths } from "./delayedInvocationDetector";
import { scanExecutionSemantics } from "./executionSemanticsScanner";
import { detectHiddenAdapters } from "./hiddenAdapterDetector";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { detectImplicitDispatchSemantics } from "./implicitDispatchDetector";
import { HIDDEN_EXECUTION_POLICY } from "./hiddenExecutionPolicy";
import { detectRecursiveOrchestration } from "./recursiveOrchestrationDetector";
import { detectRetryLoops } from "./retryLoopDetector";
import { detectRuntimeMutationPathways } from "./runtimeMutationPathwayDetector";
import { detectSchedulerRegistration } from "./schedulerRegistrationDetector";
import { detectUnauthorizedQueues } from "./unauthorizedQueueDetector";
import type {
  HiddenExecutionAuditRecord,
  HiddenExecutionBlockReason,
  HiddenExecutionDetectionInput,
  HiddenExecutionDetectionReport,
  HiddenExecutionDetectionResult,
  HiddenExecutionFinding,
  HiddenExecutionScanStatus,
} from "./types/hiddenExecutionDetectionTypes";

function buildFailClosedReport(input: HiddenExecutionDetectionInput, reason: HiddenExecutionBlockReason, error: string): HiddenExecutionDetectionResult {
  const findings: HiddenExecutionFinding[] = [];
  const reportBase = {
    reportId: hashHiddenExecutionValue("hidden-execution-report-id", {
      artifactId: input.artifactId,
      reason,
      error,
    }),
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    scannedAt: input.scannedAt,
    scanStatus: "failed_closed" as HiddenExecutionScanStatus,
    scanPassed: false,
    findings,
    detectedVectors: [],
    severity: "critical" as const,
    blocked: true,
    escalationRequired: true,
    blockReasons: [reason, error],
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    validatorVersion: input.validatorVersion,
    proposalLineageHash: input.proposalLineageHash,
    recommendationLineageHash: input.recommendationLineageHash,
    replayHash: input.replayHash,
    executionAuthorized: false as const,
    reportHash: "",
    auditHash: "",
  };
  const reportHash = hashHiddenExecutionValue("hidden-execution-report", reportBase);
  const auditHash = hashHiddenExecutionValue("hidden-execution-audit", {
    artifactId: input.artifactId,
    reason,
    reportHash,
  });
  const report: HiddenExecutionDetectionReport = {
    ...reportBase,
    reportHash,
    auditHash,
  };
  const auditRecord: HiddenExecutionAuditRecord = Object.freeze({
    recordId: hashHiddenExecutionValue("hidden-execution-audit-record-id", {
      artifactId: input.artifactId,
      reason,
    }),
    artifactId: input.artifactId,
    artifactType: input.artifactType,
    severity: "critical",
    blocked: true,
    escalationRequired: true,
    reportHash,
    auditHash,
    executionAuthorized: false as const,
  });
  const auditLedger = appendHiddenExecutionAuditEntry({
    existing: input.existingAuditLedger,
    payload: Object.freeze({
      event: "hidden-execution.failed_closed",
      artifactId: input.artifactId,
      artifactType: input.artifactType,
      reason,
      reportHash,
      auditHash,
    }),
    scope: "hidden-execution-detection",
  });
  return Object.freeze({
    report,
    auditRecord,
    auditLedger,
    deterministicHash: hashHiddenExecutionValue("hidden-execution-result", { reportHash, auditHash }),
    errors: Object.freeze([error]),
    warnings: Object.freeze(["Hidden execution detection failed closed under uncertainty."]),
    derivedOnly: true as const,
  });
}

function containsExecutableMetadata(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.executionAuthorized === true
    || record.executable === true
    || record.runtimeMutationAllowed === true
    || record.orchestrationAllowed === true;
}

function classifyReportStatus(input: {
  findings: readonly HiddenExecutionFinding[];
  severity: HiddenExecutionDetectionReport["severity"];
}): HiddenExecutionScanStatus {
  if (input.findings.length === 0) {
    return "passed";
  }
  if (input.severity === "critical" || input.findings.some((finding) => finding.blocked)) {
    return "blocked";
  }
  return "escalated";
}

function uniqueVectors(findings: readonly HiddenExecutionFinding[]) {
  return Object.freeze(
    [...new Set(findings.map((finding) => finding.vector))]
      .sort((left, right) => left.localeCompare(right)),
  );
}

function sortFindings(findings: readonly HiddenExecutionFinding[]) {
  return Object.freeze([...findings].sort((left, right) =>
    left.vector.localeCompare(right.vector)
    || left.path.localeCompare(right.path)
    || (left.matchedTerm ?? "").localeCompare(right.matchedTerm ?? "")
    || left.findingHash.localeCompare(right.findingHash)));
}

export function detectHiddenExecution(input: HiddenExecutionDetectionInput): HiddenExecutionDetectionResult {
  if (input.artifact == null) {
    return buildFailClosedReport(input, "artifact_missing", "Artifact is required for hidden execution scanning.");
  }
  if (input.artifactType === "unknown") {
    return buildFailClosedReport(input, "artifact_unknown", "Artifact type is unknown and cannot be safely classified.");
  }
  if (containsExecutableMetadata(input.artifact) || containsExecutableMetadata(input.metadata)) {
    return buildFailClosedReport(input, "hidden_execution_detected", "Executable metadata is forbidden in hidden execution scanning inputs.");
  }
  if (input.metadata?.unscannableNestedArtifact === true) {
    return buildFailClosedReport(input, "high_uncertainty", "Nested artifact could not be safely scanned.");
  }
  if (
    typeof input.metadata?.boundGovernanceSnapshotId === "string"
    && input.governanceSnapshotId
    && input.metadata.boundGovernanceSnapshotId !== input.governanceSnapshotId
  ) {
    return buildFailClosedReport(input, "governance_binding_inconsistent", "Governance binding is inconsistent with immutable snapshot context.");
  }
  if (
    typeof input.metadata?.boundReplaySnapshotId === "string"
    && input.replaySnapshotId
    && input.metadata.boundReplaySnapshotId !== input.replaySnapshotId
  ) {
    return buildFailClosedReport(input, "replay_binding_inconsistent", "Replay binding is inconsistent with immutable snapshot context.");
  }

  try {
    hashHiddenExecutionValue("hidden-execution-artifact-fingerprint", input.artifact);
    scanExecutionSemantics(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scanner failure.";
    const reason =
      message === "HIDDEN_EXECUTION_CIRCULAR_STRUCTURE"
        ? "circular_structure"
        : message.includes("serialize") || message.includes("BigInt")
          ? "hash_failure"
          : "detector_error";
    return buildFailClosedReport(input, reason, message);
  }

  try {
    const findings = sortFindings([
      ...detectDelayedInvocationPaths(input),
      ...detectSchedulerRegistration(input),
      ...detectRecursiveOrchestration(input),
      ...detectRetryLoops(input),
      ...detectHiddenAdapters(input),
      ...detectUnauthorizedQueues(input),
      ...detectImplicitDispatchSemantics(input),
      ...detectRuntimeMutationPathways(input),
    ]);

    const severity = classifyHiddenExecutionSeverity(findings);
    const detectedVectors = uniqueVectors(findings);
    const blockReasons = findings.length > 0
      ? Object.freeze(["hidden_execution_detected", ...detectedVectors])
      : Object.freeze([] as string[]);
    const scanStatus = classifyReportStatus({ findings, severity });
    const blocked = scanStatus === "blocked";
    const escalationRequired = blocked || scanStatus === "escalated";
    const reportBase = {
      reportId: hashHiddenExecutionValue("hidden-execution-report-id", {
        artifactId: input.artifactId,
        artifactType: input.artifactType,
        detectedVectors,
      }),
      artifactId: input.artifactId,
      artifactType: input.artifactType,
      scannedAt: input.scannedAt,
      scanStatus,
      scanPassed: findings.length === 0,
      findings: [...findings],
      detectedVectors: [...detectedVectors],
      severity,
      blocked,
      escalationRequired,
      blockReasons: [...blockReasons],
      governanceSnapshotId: input.governanceSnapshotId,
      replaySnapshotId: input.replaySnapshotId,
      validatorVersion: input.validatorVersion,
      proposalLineageHash: input.proposalLineageHash,
      recommendationLineageHash: input.recommendationLineageHash,
      replayHash: input.replayHash,
      executionAuthorized: false as const,
      reportHash: "",
      auditHash: "",
    };
    const reportHash = hashHiddenExecutionValue("hidden-execution-report", {
      ...reportBase,
      scannedAt: null,
    });
    const auditHash = hashHiddenExecutionValue("hidden-execution-audit", {
      artifactId: input.artifactId,
      reportHash,
      severity,
      blocked,
      escalationRequired,
    });
    const report: HiddenExecutionDetectionReport = {
      ...reportBase,
      reportHash,
      auditHash,
    };
    const auditRecord: HiddenExecutionAuditRecord = Object.freeze({
      recordId: hashHiddenExecutionValue("hidden-execution-audit-record-id", {
        artifactId: input.artifactId,
        reportHash,
      }),
      artifactId: input.artifactId,
      artifactType: input.artifactType,
      severity,
      blocked,
      escalationRequired,
      reportHash,
      auditHash,
      executionAuthorized: false as const,
    });
    const auditLedger = appendHiddenExecutionAuditEntry({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: blocked ? "hidden-execution.blocked" : escalationRequired ? "hidden-execution.escalated" : "hidden-execution.passed",
        artifactId: input.artifactId,
        artifactType: input.artifactType,
        reportHash,
        auditHash,
        detectedVectors,
        severity,
      }),
      scope: "hidden-execution-detection",
    });
    return Object.freeze({
      report,
      auditRecord,
      auditLedger,
      deterministicHash: hashHiddenExecutionValue("hidden-execution-result", {
        reportHash,
        auditHash,
        findings: findings.map((finding) => finding.findingHash),
      }),
      errors: Object.freeze([]),
      warnings: Object.freeze(
        findings.length === 0
          ? ["Hidden execution scan passed without introducing runtime power."]
          : ["Hidden execution semantics were detected and blocked without mutating the artifact."],
      ),
      derivedOnly: true as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown detector failure.";
    const reason = message.includes("hash") ? "hash_failure" : "detector_error";
    return buildFailClosedReport(input, reason, message);
  }
}
