import type {
  AuthorityBoundaryAuthorityContract,
  AuthorityBoundaryLineageEntry,
  AuthorityClassRecord,
  ConstitutionalAuthorityBoundaryInput,
  ConstitutionalAuthorityBoundaryResult,
} from "./authorityBoundaryTypes";
import { AUTHORITY_CLASSES, validateAuthorityBoundaryInput } from "./authorityBoundarySchemas";
import { hashAuthorityValue } from "./authorityHashingEngine";
import { enforceAuthorityCeiling } from "./authorityCeilingEnforcer";
import { validateGovernanceSupremacy } from "./governanceSupremacyValidator";
import { validateAuthorityLineage } from "./authorityLineageValidator";
import { validateAuthorityInheritance } from "./authorityInheritanceValidator";
import { validateAuthorityReplay } from "./authorityReplayValidator";
import { validateAuthorityTopology } from "./authorityTopologyValidator";
import { detectAuthorityDrift } from "./authorityDriftDetector";
import { detectRecursiveDelegation } from "./recursiveDelegationDetector";
import { detectPrivilegeElevation } from "./privilegeElevationDetector";
import { detectSyntheticAuthority } from "./syntheticAuthorityDetector";
import { validateAuthorityContainment } from "./authorityContainmentValidator";
import { validateAuthorityDeterminism } from "./authorityDeterminismValidator";
import { buildAuthorityRevocation } from "./authorityRevocationEngine";
import { resolveAuthorityCertificationState } from "./authorityFreezeCoordinator";
import {
  appendAuthorityBoundaryLedger,
  appendAuthorityBoundaryLineage,
  buildAuthorityEvidence,
} from "./authorityAuditLineageEngine";

function buildAuthorityContract(): AuthorityBoundaryAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    authoritySynthesis: false,
    capabilityAcquisition: false,
    approvalInheritance: false,
    recursiveDelegation: false,
    operatorSupremacyRequired: true,
  });
}

function buildAuthorityClasses(): readonly AuthorityClassRecord[] {
  return Object.freeze(AUTHORITY_CLASSES.map((authorityClass) => {
    const description = authorityClass === "A0"
      ? "Read-only inspection only."
      : authorityClass === "A1"
        ? "Recommendations only. Recommendations possess zero authority."
        : authorityClass === "A2"
          ? "Bounded governance-linked coordination only."
          : authorityClass === "A3"
            ? "Constitutional validation only."
            : "Human override authority only.";
    const advisoryOnly = authorityClass === "A0" || authorityClass === "A1";
    const deniedOperations = authorityClass === "A0"
      ? Object.freeze(["execute", "orchestrate", "mutate", "escalate"])
      : authorityClass === "A1"
        ? Object.freeze(["authorize", "execute", "orchestrate", "mutate"])
        : authorityClass === "A2"
          ? Object.freeze(["execute", "mutate-governance", "self-escalate"])
          : authorityClass === "A3"
            ? Object.freeze(["execute", "orchestrate", "self-authorize"])
            : Object.freeze(["delegate-irreversibly", "bypass-governance"]);
    return Object.freeze({
      authorityClass,
      description,
      governanceBound: true as const,
      replaySafe: true as const,
      advisoryOnly,
      operatorOverrideAllowed: true as const,
      deniedOperations,
      deterministicHash: hashAuthorityValue(`constitutional-authority-class:${authorityClass}`, {
        authorityClass,
        description,
        deniedOperations,
      }),
    });
  }));
}

export function buildConstitutionalAuthorityBoundary(
  input: ConstitutionalAuthorityBoundaryInput,
): ConstitutionalAuthorityBoundaryResult {
  const authorityContract = buildAuthorityContract();
  const authorityClasses = buildAuthorityClasses();
  const schemaErrors = validateAuthorityBoundaryInput(input);
  const ceiling = enforceAuthorityCeiling(input);
  const governanceErrors = validateGovernanceSupremacy(input);
  const lineage = validateAuthorityLineage(input);
  const inheritanceErrors = validateAuthorityInheritance(input);
  const replayErrors = validateAuthorityReplay(input);
  const topologyErrors = validateAuthorityTopology(input);
  const driftErrors = detectAuthorityDrift(input);
  const recursiveErrors = detectRecursiveDelegation(input);
  const privilegeErrors = detectPrivilegeElevation(input);
  const syntheticErrors = detectSyntheticAuthority(input);
  const containmentErrors = validateAuthorityContainment(input);
  const determinismErrors = validateAuthorityDeterminism(input);

  const errors = Object.freeze([
    ...schemaErrors,
    ...ceiling.errors,
    ...governanceErrors,
    ...lineage.errors,
    ...inheritanceErrors,
    ...replayErrors,
    ...topologyErrors,
    ...driftErrors,
    ...recursiveErrors,
    ...privilegeErrors,
    ...syntheticErrors,
    ...containmentErrors,
    ...determinismErrors,
  ]);

  const revocation = buildAuthorityRevocation({
    authorityInput: input,
    errors,
  });
  const certificationState = resolveAuthorityCertificationState({
    errors,
    revoked: revocation.revoked,
  });

  const evidence = buildAuthorityEvidence({
    boundaryId: input.boundaryId,
    gateEvidenceId: input.controlledAutonomyReadinessGateResult.evidence.evidenceId,
    evidenceRefs: Object.freeze([
      input.controlledAutonomyReadinessGateResult.evidence.evidenceId,
      input.controlledAutonomyReadinessGateResult.record.gateId,
      lineage.record.lineageId,
      revocation.revocationId,
    ]),
    reasons: Object.freeze(errors.map((item) => item.code)),
  });

  const lineageEntry: AuthorityBoundaryLineageEntry = Object.freeze({
    entryId: hashAuthorityValue("constitutional-authority-lineage-entry-id", {
      boundaryId: input.boundaryId,
      createdAt: input.createdAt,
    }),
    boundaryId: input.boundaryId,
    coordinationId: input.controlledAutonomyReadinessGateResult.record.coordinationId,
    authorityClass: input.requestedAuthorityClass,
    certificationState,
    createdAt: input.createdAt,
    deterministicHash: hashAuthorityValue("constitutional-authority-lineage-entry", {
      boundaryId: input.boundaryId,
      authorityClass: input.requestedAuthorityClass,
      certificationState,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const boundaryLineage = appendAuthorityBoundaryLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendAuthorityBoundaryLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "authority.boundary.certified",
      boundaryId: input.boundaryId,
      authorityClass: input.requestedAuthorityClass,
      certificationState,
      lineageHash: boundaryLineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "constitutional-authority-boundary",
  });
  const auditLedger = appendAuthorityBoundaryLedger({
    existing: replayLedger,
    payload: Object.freeze({
      event: revocation.revoked ? "authority.revoked" : "authority.verified",
      boundaryId: input.boundaryId,
      certificationState,
      revocationId: revocation.revocationId,
      lineageHash: boundaryLineage.lineageHash,
    }),
    scope: "constitutional-authority-boundary-audit",
  });

  const record = Object.freeze({
    boundaryId: input.boundaryId,
    coordinationId: input.controlledAutonomyReadinessGateResult.record.coordinationId,
    gateId: input.controlledAutonomyReadinessGateResult.record.gateId,
    governanceSnapshotId: input.controlledAutonomyReadinessGateResult.record.governanceSnapshotId,
    replaySnapshotId: input.controlledAutonomyReadinessGateResult.record.replaySnapshotId,
    authorityClass: input.requestedAuthorityClass,
    certificationState,
    replaySafe: input.controlledAutonomyReadinessGateResult.record.replaySafe,
    governanceBound: governanceErrors.length === 0,
    failClosed: certificationState === "FROZEN" || certificationState === "DISPUTED" || certificationState === "INVALID" || certificationState === "REVOKED",
    createdAt: input.createdAt,
  });

  return Object.freeze({
    record,
    authorityContract,
    authorityClasses,
    lineageValidation: lineage.record,
    revocation,
    evidence,
    lineage: boundaryLineage,
    replayLedger: auditLedger,
    warnings: Object.freeze(certificationState === "CONDITIONAL"
      ? ["Authority boundary remained advisory and governance-bound under elevated oversight."]
      : []),
    errors,
    deterministicHash: hashAuthorityValue("constitutional-authority-boundary-result", {
      boundaryId: input.boundaryId,
      authorityClass: input.requestedAuthorityClass,
      certificationState,
      evidenceHash: evidence.evidenceHash,
      lineageHash: boundaryLineage.lineageHash,
      revocationHash: revocation.deterministicHash,
    }),
    derivedOnly: true as const,
  });
}
