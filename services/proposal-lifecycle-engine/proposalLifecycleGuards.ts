import { readFileSync } from "node:fs";
import path from "node:path";
import type { ProposalLifecycleError, ProposalLifecycleInput } from "@/types/proposal-lifecycle-engine";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bmutate[A-Z]\w*\s*\(/,
];

export function guardProposalLifecycleInput(input: ProposalLifecycleInput): readonly ProposalLifecycleError[] {
  const errors: ProposalLifecycleError[] = [];
  if (input.readinessProfile.derivedState === "forbidden") {
    errors.push({
      code: "PROPOSAL_SAFE_ACTION_FORBIDDEN",
      message: "Forbidden readiness cannot produce proposals.",
      path: "readinessProfile",
    });
  }
  if (input.readinessProfile.autonomyLevel === "A6") {
    errors.push({
      code: "PROPOSAL_SAFE_ACTION_FORBIDDEN",
      message: "A6 remains permanently forbidden.",
      path: "autonomyLevel",
    });
  }
  return Object.freeze(errors);
}

export function assertProposalLifecycleSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadProposalLifecycleSources() {
  const files = [
    "index.ts",
    "proposalLifecycleEngine.ts",
    "proposalStateMachine.ts",
    "proposalLifecycleSchemas.ts",
    "proposalLifecycleHasher.ts",
    "proposalLifecycleValidator.ts",
    "proposalLifecycleGuards.ts",
    "proposalGovernanceBinder.ts",
    "proposalReplayBinder.ts",
    "proposalSnapshotBinder.ts",
    "proposalSafeActionBinder.ts",
    "proposalApprovalEngine.ts",
    "proposalExpirationEngine.ts",
    "proposalRevocationEngine.ts",
    "proposalLineageLedger.ts",
    "proposalHandoffPreparer.ts",
    "proposalArchiveManager.ts",
    "proposalSerializer.ts",
    "proposalNormalizer.ts",
    "proposalErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "proposal-lifecycle-engine", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
