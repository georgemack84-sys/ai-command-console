import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  BindingRejectionReason,
  DeterministicFindingIdentityInput,
  DuplicateGroupRejection,
  EvidenceReference,
  FindingConstructionContext,
  FindingDispositionEffect,
  FrozenNormalizedValidatorSet,
  InvariantEnforcementOutcome,
  NormalizedSecurityFact,
  PrepareNormalizedValidatorSetContext,
  ResolvedValidatorRequirement,
  ResultConsistencyValidation,
  ResultConsistencyViolationCode,
  SecurityDisposition,
  SecurityFinding,
  SecurityValidatorResult,
  ValidatorBindingOutcome,
  ValidatorCriticality,
} from "@/types/adaptive-memory-security-gate";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}

function canonicalClone<T>(value: T): T {
  return JSON.parse(serializeDecisionCanonically(value)) as T;
}

export function groupResultsByValidatorId(
  rawResults: readonly SecurityValidatorResult[],
): Map<string, SecurityValidatorResult[]> {
  const groups = new Map<string, SecurityValidatorResult[]>();
  for (const result of rawResults) {
    const existing = groups.get(result.validatorId) ?? [];
    existing.push(result);
    groups.set(result.validatorId, existing);
  }
  return groups;
}

export function sortValidatorGroupsCanonically(
  groups: Map<string, SecurityValidatorResult[]>,
): Array<readonly [string, SecurityValidatorResult[]]> {
  return [...groups.entries()].sort(([leftId], [rightId]) => leftId.localeCompare(rightId));
}

function sortEvidenceCanonically(values: readonly EvidenceReference[]): readonly EvidenceReference[] {
  return freezeArray([...values].sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId) ||
    a.evidenceType.localeCompare(b.evidenceType) ||
    a.integrityHash.localeCompare(b.integrityHash),
  ));
}

function sortFactsCanonically(values: readonly NormalizedSecurityFact[]): readonly NormalizedSecurityFact[] {
  return freezeArray([...values].sort((a, b) =>
    a.factId.localeCompare(b.factId) ||
    a.factType.localeCompare(b.factType) ||
    a.valueHash.localeCompare(b.valueHash),
  ));
}

function sortFindingsCanonically(values: readonly SecurityFinding[]): readonly SecurityFinding[] {
  return freezeArray([...values].sort((a, b) =>
    a.validatorId.localeCompare(b.validatorId) ||
    a.code.localeCompare(b.code) ||
    a.findingId.localeCompare(b.findingId),
  ));
}

function requirementMap(requirements: readonly ResolvedValidatorRequirement[]): Map<string, ResolvedValidatorRequirement> {
  return new Map(requirements.map((requirement) => [requirement.validatorId, requirement]));
}

function sortResultsCanonically(
  values: readonly SecurityValidatorResult[],
  requirements: readonly ResolvedValidatorRequirement[],
): readonly SecurityValidatorResult[] {
  const requirementsById = requirementMap(requirements);
  return freezeArray([...values].sort((a, b) =>
    (requirementsById.get(a.validatorId)?.executionOrder ?? Number.MAX_SAFE_INTEGER) -
      (requirementsById.get(b.validatorId)?.executionOrder ?? Number.MAX_SAFE_INTEGER) ||
    a.validatorId.localeCompare(b.validatorId) ||
    a.validatorVersion.localeCompare(b.validatorVersion),
  ));
}

function canonicalizeResult(result: SecurityValidatorResult): SecurityValidatorResult {
  return deepFreeze({
    ...result,
    findings: sortFindingsCanonically(result.findings),
    evidenceReferences: sortEvidenceCanonically(result.evidenceReferences),
    normalizedFacts: sortFactsCanonically(result.normalizedFacts),
  });
}

function outputHashFor(result: Omit<SecurityValidatorResult, "deterministicOutputHash">): string {
  return hash(result);
}

function rebuildOutputHash(result: SecurityValidatorResult): SecurityValidatorResult {
  const base: Omit<SecurityValidatorResult, "deterministicOutputHash"> = {
    validatorId: result.validatorId,
    validatorVersion: result.validatorVersion,
    criticality: result.criticality,
    applicable: result.applicable,
    completed: result.completed,
    status: result.status,
    findings: result.findings,
    evidenceReferences: result.evidenceReferences,
    normalizedFacts: result.normalizedFacts,
    deterministicInputHash: result.deterministicInputHash,
  };
  return canonicalizeResult({ ...base, deterministicOutputHash: outputHashFor(base) });
}

function findingId(input: DeterministicFindingIdentityInput): string {
  return `am-security-gate-finding-${hash(input).slice(0, 32)}`;
}

export function buildOrchestrationFinding(params: {
  evaluationId: string;
  tenantId: string;
  memoryId: string;
  validatorId: string;
  code: string;
  severity: SecurityFinding["severity"];
  dispositionEffect: FindingDispositionEffect;
  conclusive: boolean;
  summary: string;
  subjectFingerprint?: string;
  occurrenceIndex?: number;
}): SecurityFinding {
  return deepFreeze({
    findingId: findingId(params),
    tenantId: params.tenantId,
    memoryId: params.memoryId,
    validatorId: params.validatorId,
    category: "VALIDATOR_ORCHESTRATION",
    severity: params.severity,
    confidence: 1,
    conclusive: params.conclusive,
    dispositionEffect: params.dispositionEffect,
    code: params.code,
    summary: params.summary,
    normalizedEvidence: freezeArray([]),
  });
}

function duplicateGroupRejection(
  validatorId: string,
  results: readonly SecurityValidatorResult[],
  context: FindingConstructionContext,
): DuplicateGroupRejection {
  const forensicResults = freezeArray([...results].map(canonicalizeResult).sort((a, b) =>
    a.deterministicOutputHash.localeCompare(b.deterministicOutputHash) ||
    serializeDecisionCanonically(a).localeCompare(serializeDecisionCanonically(b)),
  ));
  return deepFreeze({
    validatorId,
    finding: buildOrchestrationFinding({
      ...context,
      validatorId,
      code: "DUPLICATE_VALIDATOR_RESULT",
      severity: "CRITICAL",
      dispositionEffect: "QUARANTINE",
      conclusive: false,
      summary: `Duplicate result group rejected for validator ${validatorId}.`,
      subjectFingerprint: hash(forensicResults.map(canonicalClone)),
    }),
    forensicResults,
  });
}

function bindingCode(reason: BindingRejectionReason): string {
  switch (reason) {
    case "UNREGISTERED_VALIDATOR":
      return "UNREGISTERED_VALIDATOR_RESULT";
    case "VERSION_MISMATCH":
      return "VALIDATOR_VERSION_MISMATCH";
    case "CRITICALITY_MISMATCH":
      return "VALIDATOR_CRITICALITY_MISMATCH";
  }
}

function bindSingletonResult(
  rawResult: SecurityValidatorResult,
  requirementsById: Map<string, ResolvedValidatorRequirement>,
  context: FindingConstructionContext,
): ValidatorBindingOutcome {
  const requirement = requirementsById.get(rawResult.validatorId);
  const reject = (reason: BindingRejectionReason): ValidatorBindingOutcome => deepFreeze({
    kind: "REJECTED_AS_ABSENT",
    validatorId: rawResult.validatorId,
    rawResult: canonicalizeResult(rawResult),
    reason,
    finding: buildOrchestrationFinding({
      ...context,
      validatorId: rawResult.validatorId,
      code: bindingCode(reason),
      severity: "CRITICAL",
      dispositionEffect: "QUARANTINE",
      conclusive: false,
      summary: `${rawResult.validatorId} rejected as absent: ${reason}.`,
      subjectFingerprint: hash(rawResult),
    }),
  });
  if (!requirement) return reject("UNREGISTERED_VALIDATOR");
  if (rawResult.validatorVersion !== requirement.validatorVersion) return reject("VERSION_MISMATCH");
  if (rawResult.criticality !== requirement.criticality) return reject("CRITICALITY_MISMATCH");
  return deepFreeze({ kind: "BOUND", result: canonicalizeResult(rawResult) });
}

export function validateResultConsistency(result: SecurityValidatorResult): ResultConsistencyValidation {
  const hasBlockingFinding = result.findings.some((finding) =>
    finding.dispositionEffect === "QUARANTINE" || finding.dispositionEffect === "REJECT",
  );
  const hasQuarantineFinding = result.findings.some((finding) => finding.dispositionEffect === "QUARANTINE");
  const hasConclusiveRejectFinding = result.findings.some((finding) =>
    finding.dispositionEffect === "REJECT" && finding.conclusive === true,
  );
  const hasExplanatoryFinding = result.findings.some((finding) =>
    finding.category === "VALIDATOR_ORCHESTRATION" || finding.dispositionEffect !== "INFORMATIONAL",
  );

  if (result.status === "PASS" && hasBlockingFinding) return { consistent: false, violationCode: "PASS_WITH_BLOCKING_FINDING" };
  if (result.status === "PASS" && result.completed !== true) return { consistent: false, violationCode: "INCOMPLETE_RESULT_RETURNED_PASS" };
  if (result.status === "SUSPICIOUS" && !hasQuarantineFinding) return { consistent: false, violationCode: "SUSPICIOUS_WITHOUT_QUARANTINE_FINDING" };
  if (result.status === "SUSPICIOUS" && hasConclusiveRejectFinding) return { consistent: false, violationCode: "SUSPICIOUS_WITH_CONCLUSIVE_REJECT_FINDING" };
  if (result.status === "FAIL" && !hasConclusiveRejectFinding) return { consistent: false, violationCode: "FAIL_WITHOUT_CONCLUSIVE_REJECT_FINDING" };
  if (result.status === "INDETERMINATE" && !hasExplanatoryFinding) return { consistent: false, violationCode: "INDETERMINATE_WITHOUT_EXPLANATION" };
  return { consistent: true };
}

function withAddedFinding(result: SecurityValidatorResult, finding: SecurityFinding, status: SecurityValidatorResult["status"], completed: boolean): SecurityValidatorResult {
  return rebuildOutputHash({
    ...result,
    status,
    completed,
    findings: sortFindingsCanonically([...result.findings, finding]),
  });
}

function normalizeMandatoryResult(result: SecurityValidatorResult, context: FindingConstructionContext): SecurityValidatorResult {
  const validation = validateResultConsistency(result);
  if (validation.consistent) return rebuildOutputHash(result);
  const finding = buildOrchestrationFinding({
      ...context,
      validatorId: result.validatorId,
      code: `MANDATORY_RESULT_INCONSISTENT_${validation.violationCode ?? "UNKNOWN"}`,
      severity: "CRITICAL",
      dispositionEffect: "QUARANTINE",
      conclusive: false,
      summary: `Mandatory validator result was inconsistent: ${validation.violationCode ?? "UNKNOWN"}.`,
    });
  return rebuildOutputHash({
    validatorId: result.validatorId,
    validatorVersion: result.validatorVersion,
    criticality: result.criticality,
    applicable: result.applicable,
    completed: false,
    status: "INDETERMINATE",
    findings: freezeArray([finding]),
    evidenceReferences: freezeArray([]),
    normalizedFacts: freezeArray([]),
    deterministicInputHash: result.deterministicInputHash,
    deterministicOutputHash: "",
  });
}

function strongestStatusFromFindings(result: SecurityValidatorResult): SecurityValidatorResult["status"] {
  if (result.findings.length === 0 && (result.status === "FAIL" || result.status === "SUSPICIOUS")) return result.status;
  if (result.findings.some((finding) => finding.dispositionEffect === "REJECT" && finding.conclusive)) return "FAIL";
  if (result.findings.some((finding) => finding.dispositionEffect === "QUARANTINE")) return "SUSPICIOUS";
  return result.completed ? "PASS" : "INDETERMINATE";
}

function supplementaryCode(violationCode: ResultConsistencyViolationCode): string {
  switch (violationCode) {
    case "FAIL_WITHOUT_CONCLUSIVE_REJECT_FINDING":
      return "SUPPLEMENTARY_FAILURE_WITHOUT_FINDINGS";
    case "SUSPICIOUS_WITHOUT_QUARANTINE_FINDING":
      return "SUPPLEMENTARY_SUSPICION_WITHOUT_FINDINGS";
    case "PASS_WITH_BLOCKING_FINDING":
      return "SUPPLEMENTARY_PASS_WITH_BLOCKING_FINDING";
    case "INCOMPLETE_RESULT_RETURNED_PASS":
      return "SUPPLEMENTARY_INCOMPLETE_RESULT_RETURNED_PASS";
    case "INDETERMINATE_WITHOUT_EXPLANATION":
      return "SUPPLEMENTARY_INDETERMINATE_WITHOUT_EXPLANATION";
    case "SUSPICIOUS_WITH_CONCLUSIVE_REJECT_FINDING":
      return "SUPPLEMENTARY_SUSPICIOUS_WITH_CONCLUSIVE_REJECT_FINDING";
  }
}

function normalizeSupplementaryResult(result: SecurityValidatorResult, context: FindingConstructionContext): SecurityValidatorResult {
  let candidate = rebuildOutputHash({ ...result, status: strongestStatusFromFindings(result) });
  const validation = validateResultConsistency(candidate);
  if (validation.consistent) return candidate;
  const code = supplementaryCode(validation.violationCode ?? "INDETERMINATE_WITHOUT_EXPLANATION");
  candidate = withAddedFinding(
    candidate,
    buildOrchestrationFinding({
      ...context,
      validatorId: candidate.validatorId,
      code,
      severity: "CRITICAL",
      dispositionEffect: "QUARANTINE",
      conclusive: false,
      summary: `Supplementary validator result normalized: ${validation.violationCode ?? "UNKNOWN"}.`,
    }),
    code.includes("INDETERMINATE") || code.includes("INCOMPLETE") ? "INDETERMINATE" : "SUSPICIOUS",
    code.includes("INDETERMINATE") || code.includes("INCOMPLETE") ? false : candidate.completed,
  );
  return rebuildOutputHash(candidate);
}

function normalizeResult(result: SecurityValidatorResult, context: FindingConstructionContext): SecurityValidatorResult {
  return result.criticality === "MANDATORY"
    ? normalizeMandatoryResult(result, context)
    : normalizeSupplementaryResult(result, context);
}

function replacementResult(
  result: SecurityValidatorResult,
  context: FindingConstructionContext,
  code: string,
): SecurityValidatorResult {
  const finding = buildOrchestrationFinding({
    ...context,
    validatorId: result.validatorId,
    code,
    severity: "CRITICAL",
    dispositionEffect: "QUARANTINE",
    conclusive: false,
    summary: `${result.validatorId} replaced by fail-closed invariant boundary.`,
    subjectFingerprint: hash(result),
  });
  return rebuildOutputHash({
    validatorId: result.validatorId,
    validatorVersion: result.validatorVersion,
    criticality: result.criticality,
    applicable: result.applicable,
    completed: false,
    status: "INDETERMINATE",
    findings: freezeArray([finding]),
    evidenceReferences: freezeArray([]),
    normalizedFacts: freezeArray([]),
    deterministicInputHash: result.deterministicInputHash,
    deterministicOutputHash: "",
  });
}

export function enforcePostNormalizationInvariants(
  result: SecurityValidatorResult,
  context: FindingConstructionContext,
): InvariantEnforcementOutcome {
  const validation = validateResultConsistency(result);
  const violatesCompletionRule = result.status === "PASS" && result.completed !== true;
  const violatesPassPurityRule = result.status === "PASS" && result.findings.some((finding) => finding.dispositionEffect !== "INFORMATIONAL");
  if (validation.consistent && !violatesCompletionRule && !violatesPassPurityRule) {
    return deepFreeze({ authoritativeResult: rebuildOutputHash(result) });
  }
  return deepFreeze({
    authoritativeResult: replacementResult(result, context, "NORMALIZED_RESULT_INVARIANT_VIOLATION"),
    forensicResult: canonicalizeResult(result),
  });
}

function syntheticMissingMandatory(requirement: ResolvedValidatorRequirement, context: FindingConstructionContext): SecurityValidatorResult {
  const finding = buildOrchestrationFinding({
    ...context,
    validatorId: requirement.validatorId,
    code: "MISSING_MANDATORY_VALIDATOR_RESULT",
    severity: "CRITICAL",
    dispositionEffect: "QUARANTINE",
    conclusive: false,
    summary: `Missing applicable mandatory validator result for ${requirement.validatorId}.`,
  });
  return rebuildOutputHash({
    validatorId: requirement.validatorId,
    validatorVersion: requirement.validatorVersion,
    criticality: "MANDATORY",
    applicable: true,
    completed: false,
    status: "INDETERMINATE",
    findings: freezeArray([finding]),
    evidenceReferences: freezeArray([]),
    normalizedFacts: freezeArray([]),
    deterministicInputHash: requirement.deterministicInputHash,
    deterministicOutputHash: "",
  });
}

function hashAuthoritative(input: {
  canonicalRequestHash: string;
  manifestVersion: string;
  validatorSetVersion: string;
  normalizerVersion: string;
  authoritativeResults: readonly SecurityValidatorResult[];
  orchestrationFindings: readonly SecurityFinding[];
  disqualifiedValidatorIds: readonly string[];
}): string {
  return hash(input);
}

function hashForensics(input: {
  forensicResults: readonly SecurityValidatorResult[];
  duplicateGroups: readonly unknown[];
  bindingRejections: readonly unknown[];
}): string {
  return hash(input);
}

export function prepareNormalizedValidatorSet(
  rawResults: readonly SecurityValidatorResult[],
  requirements: readonly ResolvedValidatorRequirement[],
  context: PrepareNormalizedValidatorSetContext,
): FrozenNormalizedValidatorSet {
  if (!context.evaluationId || !context.tenantId || !context.memoryId || !context.normalizerVersion) {
    throw new Error("Invalid Security Gate evaluation envelope.");
  }
  const requirementsById = requirementMap(requirements);
  const groups = groupResultsByValidatorId(rawResults);
  const authoritative = new Map<string, SecurityValidatorResult>();
  const disqualified = new Set<string>();
  const orchestrationFindings: SecurityFinding[] = [];
  const forensicResults: SecurityValidatorResult[] = [];
  const duplicateGroups: DuplicateGroupRejection[] = [];
  const bindingRejections: unknown[] = [];

  for (const [validatorId, results] of sortValidatorGroupsCanonically(groups)) {
    if (results.length > 1) {
      const rejection = duplicateGroupRejection(validatorId, results, context);
      disqualified.add(validatorId);
      orchestrationFindings.push(rejection.finding);
      forensicResults.push(...rejection.forensicResults);
      duplicateGroups.push(rejection);
      continue;
    }

    const binding = bindSingletonResult(results[0], requirementsById, context);
    if (binding.kind === "REJECTED_AS_ABSENT") {
      orchestrationFindings.push(binding.finding);
      forensicResults.push(binding.rawResult);
      bindingRejections.push(binding);
      continue;
    }

    const normalized = normalizeResult(binding.result, context);
    const enforced = enforcePostNormalizationInvariants(normalized, context);
    authoritative.set(enforced.authoritativeResult.validatorId, enforced.authoritativeResult);
    if (enforced.forensicResult) forensicResults.push(enforced.forensicResult);
  }

  for (const requirement of [...requirements].sort((a, b) => a.executionOrder - b.executionOrder || a.validatorId.localeCompare(b.validatorId))) {
    if (requirement.applicable && requirement.criticality === "MANDATORY" && !authoritative.has(requirement.validatorId)) {
      const synthetic = syntheticMissingMandatory(requirement, context);
      const enforced = enforcePostNormalizationInvariants(normalizeResult(synthetic, context), context);
      authoritative.set(requirement.validatorId, enforced.authoritativeResult);
      if (enforced.forensicResult) forensicResults.push(enforced.forensicResult);
    }
  }

  const authoritativeResults = sortResultsCanonically([...authoritative.values()], requirements);
  const canonicalFindings = sortFindingsCanonically(orchestrationFindings);
  const canonicalForensics = sortResultsCanonically(forensicResults, requirements);
  const disqualifiedValidatorIds = freezeArray([...disqualified].sort((a, b) => a.localeCompare(b)));
  const authoritativeResultSetHash = hashAuthoritative({
    canonicalRequestHash: context.canonicalRequestHash,
    manifestVersion: context.manifestVersion,
    validatorSetVersion: context.validatorSetVersion,
    normalizerVersion: context.normalizerVersion,
    authoritativeResults,
    orchestrationFindings: canonicalFindings,
    disqualifiedValidatorIds,
  });
  const forensicEvidenceHash = hashForensics({
    forensicResults: canonicalForensics,
    duplicateGroups,
    bindingRejections,
  });

  return deepFreeze({
    authoritativeResults,
    orchestrationFindings: canonicalFindings,
    forensicResults: canonicalForensics,
    disqualifiedValidatorIds,
    authoritativeResultSetHash,
    forensicEvidenceHash,
    normalizerVersion: context.normalizerVersion,
    frozen: true,
  });
}

export function deriveSecurityDisposition(validatorSet: FrozenNormalizedValidatorSet): SecurityDisposition {
  if (validatorSet.frozen !== true || !Object.isFrozen(validatorSet)) {
    return "QUARANTINED";
  }
  const results = validatorSet.authoritativeResults;
  const allFindings = [
    ...results.flatMap((result) => result.findings),
    ...validatorSet.orchestrationFindings,
  ];

  if (allFindings.some((finding) => finding.dispositionEffect === "REJECT" && finding.conclusive === true)) return "REJECTED";
  if (results.some((result) => result.status === "FAIL")) return "REJECTED";
  if (results.some((result) => result.status === "SUSPICIOUS" || result.status === "INDETERMINATE")) return "QUARANTINED";
  if (allFindings.some((finding) => finding.dispositionEffect === "QUARANTINE")) return "QUARANTINED";

  const mandatoryResults = results.filter((result) => result.criticality === "MANDATORY" && result.applicable === true);
  if (mandatoryResults.length === 0) return "QUARANTINED";

  const mandatorySetPassed = mandatoryResults.every((result) =>
    result.completed === true &&
    result.status === "PASS" &&
    result.findings.every((finding) => finding.dispositionEffect === "INFORMATIONAL"),
  );
  return mandatorySetPassed ? "VERIFIED" : "QUARANTINED";
}

export function evaluateSecurityGate(
  rawResults: readonly SecurityValidatorResult[],
  requirements: readonly ResolvedValidatorRequirement[],
  context: PrepareNormalizedValidatorSetContext,
): { validatorSet: FrozenNormalizedValidatorSet; disposition: SecurityDisposition } {
  const validatorSet = prepareNormalizedValidatorSet(rawResults, requirements, context);
  return deepFreeze({ validatorSet, disposition: deriveSecurityDisposition(validatorSet) });
}

export function buildSecurityValidatorResult(input: Omit<SecurityValidatorResult, "deterministicOutputHash">): SecurityValidatorResult {
  return rebuildOutputHash({ ...input, deterministicOutputHash: "" });
}

export function buildInformationalFinding(input: {
  tenantId: string;
  memoryId: string;
  validatorId: string;
  code?: string;
}): SecurityFinding {
  return deepFreeze({
    findingId: `info-${hash(input).slice(0, 24)}`,
    tenantId: input.tenantId,
    memoryId: input.memoryId,
    validatorId: input.validatorId,
    category: "INTEGRITY",
    severity: "INFORMATIONAL",
    confidence: 1,
    conclusive: false,
    dispositionEffect: "INFORMATIONAL",
    code: input.code ?? "VALIDATOR_INFORMATIONAL",
    summary: "Validator informational finding.",
    normalizedEvidence: freezeArray([]),
  });
}
