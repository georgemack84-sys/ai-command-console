import { getCanonicalRegistryAdapters, getCanonicalRegistryPolicies } from "@/services/registry/toolRegistry";
import { resolveExecutionBinding, type RuntimeAuthoritySnapshot, type GovernanceSnapshot } from "@/services/resolution-engine";
import { validateRuntimeEnvironment, type ActiveRuntimeState, type RuntimeValidationInput } from "@/services/runtime-validation";
import { buildResolutionFixture } from "@/tests/resolution-engine/helpers";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

export function buildRuntimeValidationFixture(): RuntimeValidationInput {
  const resolutionContext = buildResolutionFixture();
  const resolution = resolveExecutionBinding(resolutionContext);
  if (!resolution.binding) {
    throw new Error("resolution binding fixture missing");
  }
  const binding = resolution.binding;

  const adapters = getCanonicalRegistryAdapters();
  const policies = getCanonicalRegistryPolicies();
  const adapter = Object.values(adapters).find(
    (candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion,
  );
  const policy = Object.values(policies).find(
    (candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion,
  );

  if (!adapter || !policy) {
    throw new Error("adapter or policy fixture missing");
  }

  const activeRuntime: ActiveRuntimeState = {
    adapter: {
      adapterId: adapter.adapterId,
      toolId: adapter.toolId,
      version: adapter.version,
      importPath: adapter.importPath,
      runtimeHandler: adapter.runtimeHandler,
      dryRunHandler: adapter.dryRunHandler,
      rollbackHandler: adapter.rollbackHandler,
    },
    policy: {
      policyId: policy.policyId,
      toolId: policy.toolId,
      version: policy.version,
      replay: policy.replay,
      rollback: policy.rollback,
      audit: policy.audit,
    },
    runtime: resolutionContext.runtime as RuntimeAuthoritySnapshot,
    governance: resolutionContext.governance as GovernanceSnapshot,
    certification: {
      certified: true,
      certificationHash: hashStableContent("EVIDENCE_BUNDLE", {
        toolId: binding.toolId,
        toolVersion: binding.toolVersion,
        bindingHash: binding.bindingHash,
      }),
      isolationVerified: true,
      auditIntegrity: true,
      replayIntegrity: true,
      provenanceValid: true,
    },
    manifest: {
      manifestHash: hashStableContent("EVIDENCE_BUNDLE", {
        adapterId: adapter.adapterId,
        policyId: policy.policyId,
      }),
      schemaCompatible: true,
      runtimeSupported: true,
      rollbackSupported: true,
      replaySupported: true,
      adapterProvenance: adapter.adapterId,
      policyProvenance: policy.policyId,
    },
  };

  return {
    binding,
    activeRuntime,
  };
}

export function validateFixture() {
  return validateRuntimeEnvironment(buildRuntimeValidationFixture());
}
