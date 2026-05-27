import { readFileSync } from "node:fs";
import path from "node:path";
import type { CoordinationFrameworkError } from "@/types/bounded-coordination-framework";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createCoordinationError } from "./coordinationErrors";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bmutate[A-Z]\w*\s*\(/,
  /\borchestrate[A-Z]?\w*\s*\(/,
  /\bsetInterval\s*\(/,
  /\bsetTimeout\s*\(/,
  /\bacquireLock\s*\(/,
  /\breleaseLock\s*\(/,
];

export function guardCoordinationContainmentInput(input: {
  auditEpisode: AutonomyAuditEpisode;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly CoordinationFrameworkError[] {
  const errors: CoordinationFrameworkError[] = [];
  if (!input.auditEpisode.replayBinding.valid) {
    errors.push(createCoordinationError("COORDINATION_REPLAY_UNSAFE", "Bounded coordination requires valid audit replay lineage.", "auditEpisode.replayBinding"));
  }
  if (input.governanceView.policy.unknownAuthorityDisposition !== "DENY") {
    errors.push(createCoordinationError("COORDINATION_GOVERNANCE_MISSING", "Bounded coordination requires fail-closed governance.", "governance"));
  }
  if (!input.overrideContract.lineage.entries.length) {
    errors.push(createCoordinationError("COORDINATION_OVERRIDE_UNREACHABLE", "Bounded coordination requires reachable override lineage.", "override"));
  }
  if (input.metadata && hasForbiddenMetadata(input.metadata)) {
    errors.push(createCoordinationError("COORDINATION_DYNAMIC_MUTATION_FORBIDDEN", "Coordination rejected runtime or orchestration metadata.", "metadata"));
  }
  return Object.freeze(errors);
}

function hasForbiddenMetadata(metadata: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(metadata).some((key) =>
    /execute|dispatch|runtimecontrol|runtimebridge|queue|scheduler|worker|lock|process|orchestrate|async|background/i.test(key));
}

export function assertCoordinationSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadCoordinationSources() {
  const files = [
    "index.ts",
    "boundedCoordinationFramework.ts",
    "coordinationTopologyValidator.ts",
    "coordinationContainmentEngine.ts",
    "coordinationCeilingEngine.ts",
    "delegationBoundaryValidator.ts",
    "orchestrationIsolationBinder.ts",
    "coordinationReplayBinder.ts",
    "coordinationLineageLedger.ts",
    "coordinationGraphHasher.ts",
    "coordinationTopologySerializer.ts",
    "coordinationTopologyNormalizer.ts",
    "coordinationContainmentGuards.ts",
    "coordinationReplayReconstruction.ts",
    "coordinationTopologySchemas.ts",
    "coordinationErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "bounded-coordination-framework", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
