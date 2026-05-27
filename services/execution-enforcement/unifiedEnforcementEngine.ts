import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { ExecutionEnforcementDecision, RuntimeAuthorityEnvelope, UnifiedEnforcementInput, EnforcementViolation } from "./enforcementTypes";
import { validateCapabilityProvenance } from "./capabilityProvenanceValidator";
import { validateCapabilityAuthorityAdmission } from "./capabilityAuthorityAdmission";
import { deriveExecutionTrustZone } from "./capabilityDerivedTrust";
import { deriveCapabilitySandbox } from "./capabilityDerivedSandbox";
import { deriveCapabilityBoundaries } from "./capabilityDerivedBoundaries";
import { deriveCapabilityPolicyHash } from "./capabilityDerivedPolicy";
import { hashContainmentBoundary, hashSandboxProfile } from "./deterministicSandboxHasher";
import { validateReplayContainment } from "./capabilityReplayEnforcer";
import { createRuntimeAuthorityLock } from "./runtimeAuthorityLock";
import { detectRuntimeAuthorityDrift } from "./runtimeAuthorityDrift";
import { validateRuntimeContainment } from "./runtimeContainmentValidator";

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined));
}

function buildDecision(input: Omit<ExecutionEnforcementDecision, "evidenceHash">): ExecutionEnforcementDecision {
  const evidenceHash = hashStableContent("EVIDENCE_BUNDLE", removeUndefined({
    ...input,
    violations: input.violations,
  }));
  return {
    ...input,
    evidenceHash,
  };
}

function decide(violations: EnforcementViolation[], input: UnifiedEnforcementInput): {
  decision: ExecutionEnforcementDecision["decision"];
  reasonCode?: ExecutionEnforcementDecision["reasonCode"];
} {
  if (input.governanceMetadata?.simulationOnly) {
    return { decision: "SIMULATION_ONLY" };
  }
  if (!violations.length) {
    return { decision: "ALLOW" };
  }

  const codes = new Set(violations.map((violation) => violation.reasonCode));
  if (codes.has("PRIVILEGE_ESCALATION_ATTEMPT")) {
    return { decision: "ESCALATE", reasonCode: violations[0].reasonCode };
  }

  return { decision: "DENY", reasonCode: violations[0].reasonCode };
}

export function evaluateUnifiedExecutionEnforcement(input: UnifiedEnforcementInput): {
  envelope?: RuntimeAuthorityEnvelope;
  authorityLock?: ReturnType<typeof createRuntimeAuthorityLock>;
  decision: ExecutionEnforcementDecision;
} {
  const provenance = validateCapabilityProvenance(input);
  if (!provenance.entry) {
    return {
      decision: buildDecision({
        allowed: false,
        decision: "DENY",
        reasonCode: provenance.violations[0]?.reasonCode ?? "EXECUTION_POLICY_NOT_FOUND",
        toolId: input.toolId,
        toolVersion: input.toolVersion,
        registryHash: input.registryHash,
        capabilityHash: input.capabilityHash,
        violations: provenance.violations,
      }),
    };
  }

  const authorityAdmission = validateCapabilityAuthorityAdmission(input);
  const trust = deriveExecutionTrustZone(provenance.entry);
  const sandbox = deriveCapabilitySandbox(provenance.entry);
  const boundaries = deriveCapabilityBoundaries(provenance.entry, input.tenantContext?.tenantId);

  const preEnvelopeViolations = [
    ...provenance.violations,
    ...authorityAdmission.violations,
    ...trust.violations,
    ...sandbox.violations,
    ...boundaries.violations,
  ];

  if (!trust.trustZone || !sandbox.sandboxProfile || !boundaries.boundaries) {
    const decisionBasis = decide(preEnvelopeViolations, input);
    return {
      decision: buildDecision({
        allowed: false,
        decision: decisionBasis.decision,
        reasonCode: decisionBasis.reasonCode ?? "EXECUTION_BOUNDARY_DERIVATION_FAILED",
        toolId: input.toolId,
        toolVersion: input.toolVersion,
        registryHash: input.registryHash,
        capabilityHash: input.capabilityHash,
        violations: preEnvelopeViolations,
      }),
    };
  }

  const envelope: RuntimeAuthorityEnvelope = {
    toolId: provenance.entry.toolId,
    toolVersion: provenance.entry.version,
    registryHash: provenance.entry.registryHash,
    capabilityHash: provenance.entry.capabilityHash,
    runtimeCapabilities: [...provenance.entry.runtimeCapabilities],
    trustZone: trust.trustZone,
    sandboxProfile: sandbox.sandboxProfile.profileId,
    derivedPolicyHash: deriveCapabilityPolicyHash(provenance.entry),
    derivedBoundaryHash: hashContainmentBoundary(trust.trustZone, boundaries.boundaries),
    sandboxProfileHash: hashSandboxProfile(sandbox.sandboxProfile),
    environmentHash: input.runtimeMetadata?.environmentHash,
  };

  const replay = provenance.entry.supportsReplay
    ? validateReplayContainment(envelope, input.replayBinding)
    : { valid: true, violations: [] as EnforcementViolation[] };

  const containment = validateRuntimeContainment({
    entry: provenance.entry,
    boundaries: boundaries.boundaries,
    sandboxProfile: sandbox.sandboxProfile,
    request: input,
  });

  const tenantViolations: EnforcementViolation[] = [];
  if (!input.tenantContext?.tenantId || !input.tenantContext?.expectedTenantId) {
    tenantViolations.push({
      rule: "tenant.identity.required",
      reasonCode: "EXECUTION_TENANT_ISOLATION_VIOLATION",
    });
  } else if (input.tenantContext.tenantId !== input.tenantContext.expectedTenantId) {
    tenantViolations.push({
      rule: "tenant.identity.match",
      expected: input.tenantContext.expectedTenantId,
      actual: input.tenantContext.tenantId,
      reasonCode: "EXECUTION_TENANT_ISOLATION_VIOLATION",
    });
  }

  const governanceViolations: EnforcementViolation[] = [];
  if (provenance.entry.runtimeCapabilities.includes("autonomous") && !input.governanceMetadata?.governanceApproved) {
    governanceViolations.push({
      rule: "autonomous.governance-approval.required",
      expected: true,
      actual: input.governanceMetadata?.governanceApproved ?? false,
      reasonCode: "PRIVILEGE_ESCALATION_ATTEMPT",
    });
  }
  if (
    (provenance.entry.runtimeCapabilities.includes("privileged") || provenance.entry.runtimeCapabilities.includes("governance"))
    && !input.governanceMetadata?.approvalsSatisfied
  ) {
    governanceViolations.push({
      rule: "constitutional-approval.required",
      expected: true,
      actual: input.governanceMetadata?.approvalsSatisfied ?? false,
      reasonCode: "PRIVILEGE_ESCALATION_ATTEMPT",
    });
  }
  if (provenance.entry.runtimeCapabilities.includes("governance") && !input.governanceMetadata?.internalRuntime) {
    governanceViolations.push({
      rule: "governance.internal-runtime.required",
      expected: true,
      actual: input.governanceMetadata?.internalRuntime ?? false,
      reasonCode: "EXECUTION_TRUST_ZONE_VIOLATION",
    });
  }
  if ((provenance.entry.runtimeCapabilities.includes("write") || provenance.entry.runtimeCapabilities.includes("execute"))
    && !input.governanceMetadata?.rollbackPrepared) {
    governanceViolations.push({
      rule: "rollback.prepared.required",
      expected: true,
      actual: input.governanceMetadata?.rollbackPrepared ?? false,
      reasonCode: "EXECUTION_ROLLBACK_REQUIRED",
    });
  }
  if (provenance.entry.supportsReplay && !input.governanceMetadata?.replayAvailable) {
    governanceViolations.push({
      rule: "replay.available.required",
      expected: true,
      actual: input.governanceMetadata?.replayAvailable ?? false,
      reasonCode: "EXECUTION_REPLAY_REQUIRED",
    });
  }

  if (provenance.entry.trustZoneRestrictions?.allowedZones?.length) {
    const hintedZone = input.trustZoneHint ?? input.runtimeMetadata?.currentTrustZone;
    if (hintedZone && !provenance.entry.trustZoneRestrictions.allowedZones.includes(hintedZone)) {
      governanceViolations.push({
        rule: "trust-zone.restriction.match",
        expected: provenance.entry.trustZoneRestrictions.allowedZones,
        actual: hintedZone,
        reasonCode: "EXECUTION_TRUST_ZONE_VIOLATION",
      });
    }
  }

  if (input.runtimeMetadata?.sandboxProfileHash && input.runtimeMetadata.sandboxProfileHash !== envelope.sandboxProfileHash) {
    governanceViolations.push({
      rule: "runtime.sandbox-profile.match",
      expected: envelope.sandboxProfileHash,
      actual: input.runtimeMetadata.sandboxProfileHash,
      reasonCode: "RUNTIME_AUTHORITY_DRIFT_DETECTED",
    });
  }
  if (
    input.runtimeMetadata?.derivedBoundaryHash
    && input.runtimeMetadata.derivedBoundaryHash !== hashContainmentBoundary(trust.trustZone, boundaries.boundaries)
  ) {
    governanceViolations.push({
      rule: "runtime.derived-boundary.match",
      expected: hashContainmentBoundary(trust.trustZone, boundaries.boundaries),
      actual: input.runtimeMetadata.derivedBoundaryHash,
      reasonCode: "RUNTIME_AUTHORITY_DRIFT_DETECTED",
    });
  }

  const authorityLock = createRuntimeAuthorityLock({
    envelope,
    lockedAt: input.lockTimestamp,
  });
  const drift = detectRuntimeAuthorityDrift({
    envelope,
    authorityLock: input.existingAuthorityLock,
  });

  const violations = [
    ...preEnvelopeViolations,
    ...replay.violations,
    ...containment.violations,
    ...tenantViolations,
    ...governanceViolations,
    ...drift.violations,
  ];
  const decisionBasis = decide(violations, input);

  return {
    envelope,
    authorityLock,
    decision: buildDecision({
      allowed: violations.length === 0 && decisionBasis.decision === "ALLOW",
      decision: decisionBasis.decision,
      reasonCode: decisionBasis.reasonCode,
      toolId: provenance.entry.toolId,
      toolVersion: provenance.entry.version,
      registryHash: provenance.entry.registryHash,
      capabilityHash: provenance.entry.capabilityHash,
      trustZone: trust.trustZone,
      sandboxProfile: sandbox.sandboxProfile.profileId,
      violations,
    }),
  };
}
