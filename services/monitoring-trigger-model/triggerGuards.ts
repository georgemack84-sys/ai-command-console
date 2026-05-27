import { readFileSync } from "node:fs";
import path from "node:path";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { MonitoringTriggerError } from "@/types/monitoring-trigger-model";
import { createTriggerError } from "./triggerErrors";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bmutate[A-Z]\w*\s*\(/,
  /\bterminate[A-Z]?\w*\s*\(/,
  /\brestart[A-Z]?\w*\s*\(/,
  /\bacquireLock\s*\(/,
  /\breleaseLock\s*\(/,
];

export function guardMonitoringTriggerInput(input: {
  governanceView: ConstitutionalGovernanceView;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly MonitoringTriggerError[] {
  const errors: MonitoringTriggerError[] = [];
  if (!input.proposal.governanceBinding.valid || input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createTriggerError("TRIGGER_GOVERNANCE_MISSING", "Monitoring triggers require valid governance lineage.", "governance"));
  }
  if (!input.overrideContract.lineage.entries.length) {
    errors.push(createTriggerError("TRIGGER_OVERRIDE_MISSING", "Monitoring triggers require override lineage evidence.", "overrideContract.lineage"));
  }
  if (input.proposal.safeActionBinding.futureBound) {
    errors.push(createTriggerError("TRIGGER_ESCALATION_AMBIGUOUS", "Future-bound semantics remain non-operational.", "proposal.safeActionBinding"));
  }
  if (input.metadata && hasForbiddenMetadata(input.metadata)) {
    errors.push(createTriggerError("TRIGGER_METADATA_FORBIDDEN", "Monitoring trigger input rejects execution-shaped or orchestration metadata.", "metadata"));
  }
  return Object.freeze(errors);
}

function hasForbiddenMetadata(metadata: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(metadata).some((key) =>
    /execute|dispatch|runtimebridge|queue|scheduler|worker|lock|restart|terminate|suppress|inflate/i.test(key));
}

export function assertTriggerSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadMonitoringTriggerSources() {
  const files = [
    "index.ts",
    "monitoringTriggerEngine.ts",
    "triggerLedger.ts",
    "triggerDeriver.ts",
    "triggerCorrelationEngine.ts",
    "confidenceEscalator.ts",
    "driftTriggerEngine.ts",
    "replayTriggerEngine.ts",
    "governanceTriggerEngine.ts",
    "runtimeTriggerObserver.ts",
    "freezeRecommendationEngine.ts",
    "triggerReplayBinder.ts",
    "triggerHasher.ts",
    "triggerSerializer.ts",
    "triggerNormalizer.ts",
    "triggerGuards.ts",
    "triggerSchemas.ts",
    "triggerErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "monitoring-trigger-model", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
