import { admitTrustedRegistrySnapshot, createRegistryTrustAuthorityStore } from "@/services/registry-trust";
import { admitZoneExecution, type TrustZone, type ZoneAdmissionRequest } from "@/services/isolation-boundary-engine";
import { validateRuntimeEnvironment } from "@/services/runtime-validation";
import { buildRegistryTrustAuthorityFixture, buildRegistryTrustFixture } from "@/tests/registry-trust/helpers";
import { buildRuntimeValidationFixture } from "@/tests/runtime-validation/helpers";
import { buildResolutionFixture } from "@/tests/resolution-engine/helpers";

export function buildZoneAdmissionFixture(
  overrides: Partial<ZoneAdmissionRequest> = {},
): ZoneAdmissionRequest {
  const trustFixture = buildRegistryTrustFixture();
  const runtimeFixture = buildRuntimeValidationFixture();
  const resolutionFixture = buildResolutionFixture();

  const trustedSnapshotAdmission = admitTrustedRegistrySnapshot({
    snapshot: trustFixture.snapshot,
    parentSnapshot: trustFixture.parentSnapshot,
    signature: trustFixture.signature,
    provenance: trustFixture.provenance,
    authorityStore: createRegistryTrustAuthorityStore([
      buildRegistryTrustAuthorityFixture(),
    ]),
    context: trustFixture.context,
  });

  if (!trustedSnapshotAdmission.ok) {
    throw new Error(`trusted snapshot admission fixture failed: ${trustedSnapshotAdmission.reason}`);
  }

  return {
    snapshot: trustFixture.snapshot,
    trustedSnapshotAdmission,
    binding: runtimeFixture.binding,
    runtimeValidation: validateRuntimeEnvironment(runtimeFixture),
    governance: resolutionFixture.governance,
    tenantId: "tenant-a",
    sourceZone: "tenant",
    requestedZone: "tenant",
    ...overrides,
  };
}

export function evaluateZoneFixture(
  overrides: Partial<ZoneAdmissionRequest> = {},
) {
  return admitZoneExecution(buildZoneAdmissionFixture(overrides));
}

export function buildReplayRequestFromEvaluation(
  zone: ReturnType<typeof evaluateZoneFixture>,
) {
  if (!zone.allowed || !zone.profile || !zone.sandbox || !zone.filesystemPolicy || !zone.networkPolicy || !zone.credentialScope) {
    throw new Error("zone fixture must be allowed to build replay request");
  }

  return {
    originalZoneAuthorityHash: zone.profile.zoneAuthorityHash,
    originalSandboxHash: zone.sandbox.sandboxHash,
    originalFilesystemPolicyHash: zone.filesystemPolicy.policyHash,
    originalNetworkPolicyHash: zone.networkPolicy.policyHash,
    originalCredentialScopeHash: zone.credentialScope.scopeHash,
    originalGovernanceHash: zone.auditEvidence?.governanceHash ?? "",
  };
}

export const ALL_TRUST_ZONES: readonly TrustZone[] = [
  "public",
  "tenant",
  "simulation",
  "governance",
  "recovery",
  "autonomy",
  "privileged",
  "infrastructure",
  "forensic",
  "airgapped",
] as const;
