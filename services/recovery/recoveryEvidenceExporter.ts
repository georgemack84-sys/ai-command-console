import { RECOVERY_EVIDENCE_ERRORS } from "../../constants/recoveryEvidence.constants";
import type { RecoveryEvidenceBundle } from "../../types/recoveryEvidence";

type RecoveryEvidenceExportResult =
  | { ok: true; data: RecoveryEvidenceBundle | string }
  | { ok: false; error: "BLOCKED_UNSAFE_EVIDENCE_EXPORT" };

function failClosed(): RecoveryEvidenceExportResult {
  return {
    ok: false,
    error: RECOVERY_EVIDENCE_ERRORS.BLOCKED_UNSAFE_EVIDENCE_EXPORT,
  };
}

function buildMarkdown(bundle: RecoveryEvidenceBundle) {
  const lines = [
    "# Recovery Evidence Report",
    "",
    "## System State",
    "",
    `${bundle.state}`,
    "",
    "## Summary",
    "",
    `Execution: ${bundle.readModel.execution.status}`,
    `Recovery: ${bundle.readModel.recovery.status}`,
    `Control: ${bundle.readModel.recoveryControl.status}`,
    `Verification: ${bundle.readModel.verification.status}`,
    `Learning: ${bundle.readModel.learning.status}`,
    "",
    "## Execution State",
    "",
    `- Status: ${bundle.readModel.execution.status}`,
    "",
    "## Recovery Activity",
    "",
    `- Status: ${bundle.readModel.recovery.status}`,
    `- Attempts: ${bundle.readModel.recovery.attemptsCount}`,
    "",
    "## Control Flow",
    "",
    `- Status: ${bundle.readModel.recoveryControl.status}`,
    `- Requires approval: ${bundle.readModel.recoveryControl.requiresApproval}`,
    "",
    "## Advisory Insights",
    "",
    `- Status: ${bundle.readModel.advisory.status}`,
    `- Recommendation: ${bundle.readModel.advisory.recommendation || "none"}`,
    "",
    "## Verification Results",
    "",
    `- Status: ${bundle.readModel.verification.status}`,
    "",
    "## Learning Insights",
    "",
    `- Status: ${bundle.readModel.learning.status}`,
    `- Recommendations: ${bundle.readModel.learning.recommendationCount}`,
    "",
  ];

  if (bundle.state === "disputed") {
    lines.push(
      "## ⚠️ Consistency Warning",
      "",
      "Timeline does not fully explain current system state. Evidence should be reviewed before taking action.",
      "",
    );
  }

  lines.push(
    "## Timeline",
    "",
    ...bundle.timeline.events.map((event) => `- ${event.timestamp}: ${event.type} (${event.source})`),
    "",
    "## Integrity",
    "",
    `- Hash: ${bundle.integrity.hash}`,
    `- Algorithm: ${bundle.integrity.algorithm}`,
    `- Matches read model: ${bundle.integrity.matchesReadModel}`,
  );

  return lines.join("\n");
}

export function exportRecoveryEvidence(
  bundle: RecoveryEvidenceBundle,
  format: "json" | "markdown",
): RecoveryEvidenceExportResult {
  try {
    if (!bundle || typeof bundle !== "object") {
      return failClosed();
    }
    if (format === "json") {
      return { ok: true, data: bundle };
    }
    if (format === "markdown") {
      return { ok: true, data: buildMarkdown(bundle) };
    }
    return failClosed();
  } catch {
    return failClosed();
  }
}

