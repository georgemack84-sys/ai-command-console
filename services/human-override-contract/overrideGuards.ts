import { readFileSync } from "node:fs";
import path from "node:path";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { OverrideContractError, OverrideEvent } from "@/types/human-override-contract";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bmutate[A-Z]\w*\s*\(/,
  /\bexecute[A-Z]?\w*\s*\(/,
];

export function guardOverrideInputs(input: {
  events: readonly OverrideEvent[];
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly OverrideContractError[] {
  const errors: OverrideContractError[] = [];
  if (!input.proposal.governanceBinding.valid || input.approvalGraph.errors.some((error) => error.code.includes("GOVERNANCE"))) {
    errors.push({
      code: "OVERRIDE_GOVERNANCE_MISSING",
      message: "Override contract requires valid governance lineage.",
      path: "governance",
    });
  }
  if (input.proposal.safeActionBinding.futureBound) {
    errors.push({
      code: "OVERRIDE_SCOPE_INVALID",
      message: "Future-bound semantics remain non-operational under override contracts.",
      path: "proposal.safeActionBinding",
    });
  }
  if (input.metadata && hasForbiddenMetadata(input.metadata)) {
    errors.push({
      code: "OVERRIDE_GOVERNANCE_MISSING",
      message: "Override contract rejects runtime bridge or execution-shaped metadata.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}

function hasForbiddenMetadata(metadata: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(metadata).some((key) => /runtimebridge|execute|dispatch|scheduler|worker|queue/i.test(key));
}

export function assertOverrideSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadOverrideSources() {
  const files = [
    "index.ts",
    "overrideContractEngine.ts",
    "overrideAuthorityValidator.ts",
    "overrideLineageLedger.ts",
    "freezeStateDeriver.ts",
    "killSwitchContract.ts",
    "overrideReplayBinder.ts",
    "overrideConflictResolver.ts",
    "overrideHasher.ts",
    "overrideSerializer.ts",
    "overrideNormalizer.ts",
    "overrideGuards.ts",
    "overrideSchemas.ts",
    "overrideErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "human-override-contract", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
