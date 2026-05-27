import { readFileSync } from "node:fs";
import path from "node:path";
import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createReadinessError } from "./readinessErrors";

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

const FORBIDDEN_METADATA_PATTERN = /schedulerid|queueid|workerid|processid|lockowner|runtimehandle|dispatchid|executionhandle|orchestrationid|retryloop|backgroundtask|autonomousrecovery|selfhealing|adaptiveauthority|dynamicauthority|silentretry|recursivedelegation/i;

export function guardReadinessInput(input: {
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];
  if (input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createReadinessError("AUTONOMY_GOVERNANCE_MISMATCH", "Readiness gate requires fail-closed governance.", "governance"));
  }
  if (!input.overrideContract.lineage.entries.length) {
    errors.push(createReadinessError("AUTONOMY_OPERATOR_OVERRIDE", "Override lineage is required for readiness certification.", "override"));
  }
  if (input.metadata && Object.keys(input.metadata).some((key) => FORBIDDEN_METADATA_PATTERN.test(key))) {
    errors.push(createReadinessError("AUTONOMY_RUNTIME_UNSAFE", "Forbidden runtime, orchestration, or retry metadata detected.", "metadata"));
  }
  return Object.freeze(errors);
}

export function assertReadinessSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadReadinessSources() {
  const files = [
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
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "constitutional-autonomy-readiness-gate", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
