import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { collectDangerousDynamicTerms, scanExecutionSemantics } from "./executionSemanticsScanner";

const MUTATION_TERMS = Object.freeze([
  "mutate registry",
  "update policy",
  "alter governance",
  "modify approvals",
  "change scheduler",
  "update queue",
  "rewrite validator",
  "update confidence model",
  "mutate policy snapshot",
  "update governance contract",
  "use latest registry target",
]);

export function detectRuntimeMutationPathways(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  const scanned = scanExecutionSemantics(input);
  const dynamicFindings = collectDangerousDynamicTerms(scanned);
  const termFindings = scanned.flatMap((entry) => MUTATION_TERMS
    .filter((term) => entry.value.toLowerCase().includes(term))
    .map((term) => {
      const vector = term.includes("latest registry")
        ? "authority_expansion_path" as const
        : "runtime_mutation_pathway" as const;
      return Object.freeze({
        findingId: hashHiddenExecutionValue("runtime-mutation-finding-id", { path: entry.path, term }),
        vector,
        severity: "critical" as const,
        path: entry.path,
        matchedTerm: term,
        evidence: entry.value,
        blocked: true,
        escalationRequired: true,
        executionAuthorized: false as const,
        findingHash: hashHiddenExecutionValue("runtime-mutation-finding", { path: entry.path, term, evidence: entry.value }),
      });
    }));

  const dynamicTermFindings = dynamicFindings.map((entry) => Object.freeze({
    findingId: hashHiddenExecutionValue("dynamic-term-finding-id", { path: entry.path, value: entry.value }),
    vector: "runtime_mutation_pathway" as const,
    severity: "medium" as const,
    path: entry.path,
    matchedTerm: undefined,
    evidence: entry.value,
    blocked: true,
    escalationRequired: true,
    executionAuthorized: false as const,
    findingHash: hashHiddenExecutionValue("dynamic-term-finding", { path: entry.path, value: entry.value }),
  }));

  return Object.freeze([...termFindings, ...dynamicTermFindings]);
}
