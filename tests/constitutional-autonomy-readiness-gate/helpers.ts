import { readFileSync } from "node:fs";
import path from "node:path";

import { buildConstitutionalAutonomyReadinessGate } from "@/services/constitutional-autonomy-readiness-gate";
import type { ConstitutionalAutonomyReadinessGateInput } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalEscalationFixture } from "@/tests/constitutional-escalation-layer/helpers";

export function buildConstitutionalReadinessGateFixture(overrides: Partial<{
  metadata: Readonly<Record<string, unknown>>;
  confidenceScore: number;
  previousConfidenceScore: number;
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
}> = {}) {
  const escalationFixture = buildConstitutionalEscalationFixture(overrides);
  const input: ConstitutionalAutonomyReadinessGateInput = Object.freeze({
    governanceView: escalationFixture.input.governanceView,
    readinessProfile: escalationFixture.coordinationFixture.auditFixture.monitoringFixture.overrideFixture.approvalFixture.proposalFixture.safeActionFixture.readinessProfile,
    safeActionProfile: escalationFixture.coordinationFixture.auditFixture.monitoringFixture.overrideFixture.approvalFixture.proposalFixture.safeActionFixture.safeActionProfile,
    proposal: escalationFixture.coordinationFixture.auditFixture.input.proposal,
    approvalGraph: escalationFixture.coordinationFixture.auditFixture.input.approvalGraph,
    overrideContract: escalationFixture.coordinationFixture.auditFixture.input.overrideContract,
    monitoringModel: escalationFixture.coordinationFixture.auditFixture.input.monitoringModel,
    auditEpisode: escalationFixture.coordinationFixture.auditFixture.episode,
    coordinationFramework: escalationFixture.coordinationFixture.framework,
    escalation: escalationFixture.escalation,
    replay: escalationFixture.input.replay,
    generatedAt: "2026-05-16T19:00:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    escalationFixture,
    input,
    gate: buildConstitutionalAutonomyReadinessGate(input),
  };
}

export function loadReadinessGateSources() {
  const root = path.resolve("services", "constitutional-autonomy-readiness-gate");
  return [
    "index.ts",
    "constitutionalAutonomyReadinessGate.ts",
    "readinessCertificationEngine.ts",
    "readinessReplayValidator.ts",
    "readinessGovernanceValidator.ts",
    "readinessApprovalValidator.ts",
    "readinessOverrideValidator.ts",
    "readinessContainmentInspector.ts",
    "hiddenExecutionDetector.ts",
    "runtimeBoundaryValidator.ts",
    "readinessDriftDetector.ts",
    "readinessLineageLedger.ts",
    "readinessReplayBinder.ts",
    "readinessReplayReconstruction.ts",
    "readinessSerializer.ts",
    "readinessHasher.ts",
    "readinessNormalizer.ts",
    "readinessGuards.ts",
    "readinessSchemas.ts",
    "readinessErrors.ts",
    "readinessConfidenceValidator.ts",
    "readinessTopologyValidator.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
