import { readFileSync } from "node:fs";
import path from "node:path";
import type { ConstitutionalEscalationError } from "@/types/constitutional-escalation-layer";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import { createEscalationError } from "./escalationErrors";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\borchestrate[A-Z]?\w*\s*\(/,
  /\bsetInterval\s*\(/,
  /\bsetTimeout\s*\(/,
  /\bacquireLock\s*\(/,
  /\breleaseLock\s*\(/,
];

const FORBIDDEN_METADATA_PATTERN = /schedulerid|queueid|workerid|processid|lockowner|runtimehandle|dispatchid|executionhandle|orchestrationid|retryloop|backgroundtask|autonomousrecovery|selfhealing|adaptiveauthority|dynamicescalation|recursivedelegation/i;

export function guardEscalationInput(input: {
  monitoringModel: MonitoringTriggerModel;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ConstitutionalEscalationError[] {
  const errors: ConstitutionalEscalationError[] = [];
  if (input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createEscalationError("ESCALATION_GOVERNANCE_MISSING", "Constitutional escalation requires fail-closed governance.", "governance"));
  }
  if (!input.overrideContract.lineage.entries.length) {
    errors.push(createEscalationError("ESCALATION_OVERRIDE_MISSING", "Constitutional escalation requires override lineage.", "override"));
  }
  if (!input.monitoringModel.confidenceEscalation.lineageHash) {
    errors.push(createEscalationError("ESCALATION_CONFIDENCE_MISSING", "Confidence lineage is required for escalation.", "monitoringModel.confidenceEscalation"));
  }
  if (!input.coordinationFramework.lineage.entries.length) {
    errors.push(createEscalationError("ESCALATION_MUTABLE_LINEAGE", "Coordination lineage must be append-only and non-empty.", "coordinationFramework.lineage"));
  }
  if (input.metadata && Object.keys(input.metadata).some((key) => FORBIDDEN_METADATA_PATTERN.test(key))) {
    errors.push(createEscalationError("ESCALATION_RUNTIME_METADATA_FORBIDDEN", "Forbidden runtime or orchestration metadata detected.", "metadata"));
  }
  return Object.freeze(errors);
}

export function assertEscalationSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadEscalationSources() {
  const files = [
    "index.ts",
    "constitutionalEscalationEngine.ts",
    "escalationSeverityEngine.ts",
    "oversightRecommendationLayer.ts",
    "constitutionalFreezeRecommendation.ts",
    "escalationReplayBinder.ts",
    "escalationReplayReconstruction.ts",
    "escalationLineageLedger.ts",
    "escalationHasher.ts",
    "escalationSerializer.ts",
    "escalationNormalizer.ts",
    "escalationGuards.ts",
    "escalationSchemas.ts",
    "escalationErrors.ts",
    "escalationEvidenceBinder.ts",
    "escalationTopologyValidator.ts",
    "escalationConfidenceEngine.ts",
    "escalationPolicyValidator.ts",
    "escalationContainmentEvaluator.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "constitutional-escalation-layer", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
