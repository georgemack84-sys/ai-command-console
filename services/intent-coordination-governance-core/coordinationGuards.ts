import { readFileSync } from "node:fs";
import path from "node:path";
import type { CoordinationGovernanceError } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { createCoordinationGovernanceError } from "./coordinationErrors";

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

const FORBIDDEN_METADATA_PATTERN = /scheduler|queue|worker|runtimehandle|process|lock|retry|orchestration|dispatch|execution|background|adaptiveauthority|dynamicauthority|recursivedelegation/i;

export function guardIntentCoordinationInput(input: {
  governanceView: ConstitutionalGovernanceView;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  if (input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createCoordinationGovernanceError("COORDINATION_GOVERNANCE_MISMATCH", "Intent coordination requires fail-closed governance.", "governance"));
  }
  if (input.metadata && Object.keys(input.metadata).some((key) => FORBIDDEN_METADATA_PATTERN.test(key))) {
    errors.push(createCoordinationGovernanceError("COORDINATION_EXECUTION_LEAK", "Forbidden runtime or orchestration metadata detected.", "metadata"));
  }
  return Object.freeze(errors);
}

export function assertCoordinationGovernanceSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadCoordinationGovernanceSources() {
  const files = [
    "intentCoordinationGovernanceCore.ts",
    "coordinationGovernanceSchema.ts",
    "coordinationStateEngine.ts",
    "coordinationBoundaryValidator.ts",
    "coordinationRelationshipValidator.ts",
    "coordinationLifecycleValidator.ts",
    "coordinationReplayBinder.ts",
    "coordinationReplayReconstruction.ts",
    "coordinationReplayValidator.ts",
    "coordinationTopologyValidator.ts",
    "escalationGovernanceModel.ts",
    "escalationContainmentValidator.ts",
    "coordinationContainmentInspector.ts",
    "coordinationLineageLedger.ts",
    "coordinationHasher.ts",
    "coordinationSerializer.ts",
    "coordinationNormalizer.ts",
    "coordinationDriftDetector.ts",
    "coordinationGuards.ts",
    "coordinationSchemas.ts",
    "coordinationErrors.ts",
    "coordinationAuditEvents.ts",
    "coordinationTransitionValidator.ts",
    "coordinationReadinessBinder.ts",
    "coordinationDependencyValidator.ts",
    "index.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "intent-coordination-governance-core", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
