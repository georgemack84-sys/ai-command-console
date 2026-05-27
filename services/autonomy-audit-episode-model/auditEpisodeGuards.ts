import { readFileSync } from "node:fs";
import path from "node:path";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { AutonomyAuditEpisodeError } from "@/types/autonomy-audit-episode-model";
import { createAuditEpisodeError } from "./auditEpisodeErrors";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bmutate[A-Z]\w*\s*\(/,
  /\borchestrate[A-Z]?\w*\s*\(/,
  /\brestart[A-Z]?\w*\s*\(/,
  /\bdeploy[A-Z]?\w*\s*\(/,
];

export function guardAuditEpisodeInput(input: {
  monitoringModel: MonitoringTriggerModel;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly AutonomyAuditEpisodeError[] {
  const errors: AutonomyAuditEpisodeError[] = [];
  if (!input.monitoringModel.replayBinding.valid) {
    errors.push(createAuditEpisodeError("AUTONOMY_REPLAY_MISMATCH", "Autonomy audit episodes require valid monitoring replay bindings.", "monitoringModel.replayBinding"));
  }
  if (!input.proposal.governanceBinding.valid || input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createAuditEpisodeError("AUTONOMY_GOVERNANCE_LINK_MISSING", "Autonomy audit episodes require valid governance lineage.", "governance"));
  }
  if (!input.overrideContract.lineage.entries.length) {
    errors.push(createAuditEpisodeError("AUTONOMY_OPERATOR_LINEAGE_INVALID", "Operator chronology requires immutable override lineage.", "overrideContract.lineage"));
  }
  if (input.metadata && hasForbiddenMetadata(input.metadata)) {
    errors.push(createAuditEpisodeError("AUTONOMY_AUDIT_EPISODE_INVALID", "Audit episodes reject execution-shaped or orchestration metadata.", "metadata"));
  }
  return Object.freeze(errors);
}

function hasForbiddenMetadata(metadata: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(metadata).some((key) =>
    /execute|dispatch|runtimecontrol|runtimebridge|queue|scheduler|worker|lock|process|orchestrate|restart|deploy/i.test(key));
}

export function assertAuditEpisodeSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadAuditEpisodeSources() {
  const files = [
    "index.ts",
    "autonomyAuditEpisodeEngine.ts",
    "auditEpisodeLedger.ts",
    "auditEpisodeHasher.ts",
    "auditEpisodeSerializer.ts",
    "auditEpisodeNormalizer.ts",
    "observationBindingLayer.ts",
    "interpretationReconstructionEngine.ts",
    "recommendationLineageEngine.ts",
    "riskAnalysisReconstruction.ts",
    "approvalRequirementBinder.ts",
    "operatorInteractionLedger.ts",
    "outcomeReconstructionEngine.ts",
    "auditReplayBinder.ts",
    "auditEpisodeGuards.ts",
    "auditEpisodeSchemas.ts",
    "auditEpisodeErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "autonomy-audit-episode-model", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
