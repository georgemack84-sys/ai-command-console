import { readFileSync } from "node:fs";
import path from "node:path";
import type { ApprovalDependencyGraphInput, ApprovalLifecycleError } from "@/types/approval-dependency-graph";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bruntimeBridge[A-Z]?\w*\s*\(/,
  /\bapprove[A-Z]\w*\s*\(/,
  /\bdeny[A-Z]\w*\s*\(/,
];

export function guardApprovalDependencyInput(input: ApprovalDependencyGraphInput): readonly ApprovalLifecycleError[] {
  const errors: ApprovalLifecycleError[] = [];
  if (input.proposal.lifecycleDecision !== "ALLOW" && input.proposal.currentState !== "draft") {
    errors.push({
      code: "APPROVAL_DEPENDENCY_UNKNOWN_STATE",
      message: "Approval graph requires a lawful proposal lifecycle state.",
      path: "proposal.lifecycleDecision",
    });
  }
  if (input.proposal.safeActionBinding.futureBound) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_FUTURE_BOUND_ESCALATION",
      message: "Future-bound semantics remain non-operational.",
      path: "proposal.safeActionBinding",
    });
  }
  return Object.freeze(errors);
}

export function assertApprovalDependencySourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadApprovalDependencySources() {
  const files = [
    "index.ts",
    "approvalDependencyGraphEngine.ts",
    "approvalDependencyResolver.ts",
    "approvalDependencyValidator.ts",
    "approvalInheritanceEngine.ts",
    "approvalRevocationPropagator.ts",
    "approvalReplayBinder.ts",
    "approvalTimeWindowEngine.ts",
    "approvalGraphHasher.ts",
    "approvalGraphSerializer.ts",
    "approvalGraphNormalizer.ts",
    "approvalDependencyLedger.ts",
    "approvalDependencyGuards.ts",
    "approvalDependencySchemas.ts",
    "approvalDependencyErrors.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "approval-dependency-graph", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
