import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashReadinessValue } from "@/services/constitutional-readiness/readinessHashEngine";
import type { ConstitutionalReadinessResult } from "@/types/constitutional-readiness";
import type {
  ControlledAutonomyDomainCertification,
  ControlledAutonomyGateAuthorityContract,
  ControlledAutonomyGateError,
  ControlledAutonomyGateEvidence,
  ControlledAutonomyGateLedgerEntry,
  ControlledAutonomyGateLineageEntry,
  ControlledAutonomyGateLineageGraph,
  ControlledAutonomyGateLineageLedger,
  ControlledAutonomyGateRiskRecord,
  ControlledAutonomyReadinessGateInput,
  ControlledAutonomyReadinessGateResult,
} from "./controlledAutonomyReadinessGate";
import { validateConstitutionalReadinessEnvelope } from "./constitutionalReadinessEvaluator";
import { classifyGateState } from "./readinessClassificationEngine";

function buildAuthorityContract(): ControlledAutonomyGateAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    authorityInheritance: false,
    approvalInheritance: false,
    privilegeEscalationAuthority: false,
    adaptiveAutonomyAuthority: false,
    workflowContinuation: false,
    readinessAuthorization: false,
    autonomyAuthorization: false,
    humanSupremacyOverrideRequired: true,
  });
}

function buildEvidence(input: {
  gateId: string;
  readiness: ConstitutionalReadinessResult;
  domains: readonly ControlledAutonomyDomainCertification[];
  errors: readonly ControlledAutonomyGateError[];
}): ControlledAutonomyGateEvidence {
  const evidenceRefs = Object.freeze([
    input.readiness.evidence.evidenceId,
    ...input.domains.map((item) => item.evidenceHash),
  ].sort());
  const reasons = Object.freeze(input.errors.map((item) => item.code).sort());
  return Object.freeze({
    evidenceId: hashReadinessValue("controlled-autonomy-gate-evidence-id", input.gateId),
    gateId: input.gateId,
    readinessEvidenceId: input.readiness.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashReadinessValue("controlled-autonomy-gate-evidence", {
      gateId: input.gateId,
      evidenceRefs,
      reasons,
    }),
  });
}

function appendGateLineage(input: {
  existing?: ControlledAutonomyGateLineageLedger;
  entry: ControlledAutonomyGateLineageEntry;
}): ControlledAutonomyGateLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashReadinessValue("controlled-autonomy-gate-lineage", entries),
  });
}

function buildGateLineageGraph(lineage: ControlledAutonomyGateLineageLedger): ControlledAutonomyGateLineageGraph {
  const nodes = Object.freeze(lineage.entries.map((entry) => Object.freeze({
    nodeId: entry.entryId,
    gateId: entry.gateId,
    classification: entry.certificationState,
  })));
  const edges = Object.freeze(lineage.entries.slice(1).map((entry, index) => Object.freeze({
    from: lineage.entries[index]!.entryId,
    to: entry.entryId,
    deterministicHash: hashReadinessValue("controlled-autonomy-gate-lineage-edge", {
      from: lineage.entries[index]!.entryId,
      to: entry.entryId,
    }),
  })));
  return Object.freeze({
    graphId: hashReadinessValue("controlled-autonomy-gate-lineage-graph-id", lineage.lineageHash),
    nodes,
    edges,
    graphHash: hashReadinessValue("controlled-autonomy-gate-lineage-graph", { nodes, edges }),
  });
}

function appendGateLedger(input: {
  existing?: readonly ControlledAutonomyGateLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ControlledAutonomyGateLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}

function buildRisk(input: {
  gateId: string;
  domains: readonly ControlledAutonomyDomainCertification[];
  classification: string;
}): ControlledAutonomyGateRiskRecord {
  const aggregateScore = Number((
    input.domains.reduce((sum, item) => sum + (item.certified ? 1 : item.classification === "CONDITIONAL" ? 0.75 : item.classification === "DEGRADED" ? 0.5 : 0), 0)
    / input.domains.length
  ).toFixed(4));
  const riskLevel = input.classification === "VERIFIED"
    ? "low"
    : input.classification === "CONDITIONAL"
      ? "moderate"
      : input.classification === "DEGRADED"
        ? "high"
        : "critical";
  return Object.freeze({
    riskId: hashReadinessValue("controlled-autonomy-gate-risk-id", input.gateId),
    gateId: input.gateId,
    riskLevel,
    aggregateScore,
    deterministicHash: hashReadinessValue("controlled-autonomy-gate-risk", {
      gateId: input.gateId,
      riskLevel,
      aggregateScore,
    }),
  });
}

export function buildFinalReadinessDecision(input: {
  input: ControlledAutonomyReadinessGateInput;
  readiness: ConstitutionalReadinessResult;
  domains: readonly ControlledAutonomyDomainCertification[];
}): ControlledAutonomyReadinessGateResult {
  const envelopeErrors = validateConstitutionalReadinessEnvelope(input.input);
  const errors = Object.freeze([
    ...input.readiness.errors.map((item) => Object.freeze({
      code: item.code,
      message: item.message,
      path: item.path,
    })),
    ...input.domains.flatMap((domain) => domain.reasons.map((reason) => Object.freeze({
      code: reason,
      message: `Controlled autonomy gate detected a ${domain.domain} certification issue.`,
      path: `domainCertifications.${domain.domain}`,
    }))),
    ...envelopeErrors,
  ] satisfies readonly ControlledAutonomyGateError[]);

  const certificationState = classifyGateState({
    inheritedClassification: input.readiness.record.readinessClassification,
    domains: input.domains,
    errors,
  });
  const authorityContract = buildAuthorityContract();
  const evidence = buildEvidence({
    gateId: input.input.gateId,
    readiness: input.readiness,
    domains: input.domains,
    errors,
  });
  const lineageEntry: ControlledAutonomyGateLineageEntry = Object.freeze({
    entryId: hashReadinessValue("controlled-autonomy-gate-lineage-entry-id", {
      gateId: input.input.gateId,
      createdAt: input.input.createdAt,
    }),
    gateId: input.input.gateId,
    coordinationId: input.readiness.record.coordinationId,
    certificationState,
    createdAt: input.input.createdAt,
    deterministicHash: hashReadinessValue("controlled-autonomy-gate-lineage-entry", {
      gateId: input.input.gateId,
      certificationState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendGateLineage({
    existing: input.input.existingLineage,
    entry: lineageEntry,
  });
  const lineageGraph = buildGateLineageGraph(lineage);
  const replayLedger = appendGateLedger({
    existing: input.input.existingReplayLedger,
    payload: Object.freeze({
      event: "controlled-autonomy-readiness.certified",
      gateId: input.input.gateId,
      certificationState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "controlled-autonomy-readiness-gate",
  });
  const auditLedger = appendGateLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: certificationState === "VERIFIED" ? "gate.verified" : "gate.frozen",
      gateId: input.input.gateId,
      certificationState,
      readinessHash: input.readiness.deterministicHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "controlled-autonomy-readiness-gate-audit",
  });
  const risk = buildRisk({
    gateId: input.input.gateId,
    domains: input.domains,
    classification: certificationState,
  });
  const record = Object.freeze({
    gateId: input.input.gateId,
    coordinationId: input.readiness.record.coordinationId,
    readinessId: input.readiness.record.readinessId,
    telemetryId: input.readiness.record.telemetryId,
    governanceSnapshotId: input.readiness.record.governanceSnapshotId,
    replaySnapshotId: input.readiness.record.replaySnapshotId,
    certificationState,
    replaySafe: input.readiness.record.replaySafe,
    failClosed: certificationState === "FROZEN" || certificationState === "INVALID" || certificationState === "DISPUTED",
    createdAt: input.input.createdAt,
  });

  return Object.freeze({
    record,
    authorityContract,
    constitutionalReadiness: input.readiness,
    domainCertifications: input.domains,
    evidence,
    lineage,
    lineageGraph,
    replayLedger: auditLedger,
    risk,
    warnings: Object.freeze(certificationState === "CONDITIONAL"
      ? ["Certification remained advisory-only and increased oversight without granting authority."]
      : []),
    errors,
    deterministicHash: hashReadinessValue("controlled-autonomy-gate-final-result", {
      gateId: input.input.gateId,
      certificationState,
      readinessHash: input.readiness.deterministicHash,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
      riskHash: risk.deterministicHash,
    }),
    derivedOnly: true as const,
  });
}
