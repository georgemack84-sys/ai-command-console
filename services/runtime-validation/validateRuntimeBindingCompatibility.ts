import { getCanonicalRegistryAdapters, getCanonicalRegistryPolicies } from "@/services/registry/toolRegistry";
import type { RuntimeBindingCompatibilityResult, RuntimeValidationFailure, RuntimeValidationInput } from "./runtimeValidationTypes";
import { hashRuntimeCompatibility } from "./runtimeValidationHasher";

export function validateRuntimeBindingCompatibility(input: RuntimeValidationInput): RuntimeBindingCompatibilityResult {
  const failures: RuntimeValidationFailure[] = [];
  const { binding, activeRuntime } = input;
  const adapters = getCanonicalRegistryAdapters();
  const policies = getCanonicalRegistryPolicies();

  if (!activeRuntime.runtime.envelope.capabilityHash || !activeRuntime.runtime.envelope.sandboxProfileHash) {
    failures.push({
      code: "TOOL_RUNTIME_UNKNOWN",
      message: "active runtime authority hashes are incomplete",
    });
  }

  if (binding.registryHash !== activeRuntime.runtime.envelope.registryHash) {
    failures.push({
      code: "RUNTIME_BINDING_MISMATCH",
      message: "runtime registry hash does not match immutable execution binding",
      expected: binding.registryHash,
      actual: activeRuntime.runtime.envelope.registryHash,
    });
  }

  if (binding.capabilityHash !== activeRuntime.runtime.envelope.capabilityHash) {
    failures.push({
      code: "RUNTIME_BINDING_MISMATCH",
      message: "runtime capability hash does not match immutable execution binding",
      expected: binding.capabilityHash,
      actual: activeRuntime.runtime.envelope.capabilityHash,
    });
  }

  if (binding.sandboxProfileHash !== activeRuntime.runtime.envelope.sandboxProfileHash) {
    failures.push({
      code: "RUNTIME_SANDBOX_DRIFT",
      message: "active sandbox profile does not match immutable execution binding",
      expected: binding.sandboxProfileHash,
      actual: activeRuntime.runtime.envelope.sandboxProfileHash,
    });
  }

  if (binding.runtimeAuthorityLockHash !== activeRuntime.runtime.authorityLock.lockHash) {
    failures.push({
      code: "RUNTIME_AUTHORITY_DRIFT",
      message: "runtime authority lock does not match immutable execution binding",
      expected: binding.runtimeAuthorityLockHash,
      actual: activeRuntime.runtime.authorityLock.lockHash,
    });
  }

  if (binding.replayContainmentHash !== activeRuntime.governance.evidenceBundle.replayContainmentHash) {
    failures.push({
      code: "RUNTIME_REPLAY_CONTAINMENT_DRIFT",
      message: "replay containment hash does not match immutable execution binding",
      expected: binding.replayContainmentHash,
      actual: activeRuntime.governance.evidenceBundle.replayContainmentHash,
    });
  }

  const adapter = Object.values(adapters).find(
    (candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion,
  );
  if (!adapter) {
    failures.push({
      code: "TOOL_ADAPTER_INCOMPATIBLE",
      message: "active runtime adapter is not published in canonical registry",
    });
  } else if (
    adapter.adapterId !== activeRuntime.adapter.adapterId
    || adapter.importPath !== activeRuntime.adapter.importPath
    || adapter.runtimeHandler !== activeRuntime.adapter.runtimeHandler
  ) {
    failures.push({
      code: "TOOL_ADAPTER_INCOMPATIBLE",
      message: "active runtime adapter does not match canonical registry adapter definition",
    });
  }

  const policy = Object.values(policies).find(
    (candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion,
  );
  if (!policy) {
    failures.push({
      code: "RUNTIME_POLICY_DRIFT",
      message: "active runtime policy is not published in canonical registry",
    });
  } else {
    if (!activeRuntime.manifest.schemaCompatible) {
      failures.push({
        code: "TOOL_SCHEMA_INCOMPATIBLE",
        message: "active runtime manifest reports schema incompatibility",
      });
    }
    if (!activeRuntime.manifest.runtimeSupported) {
      failures.push({
        code: "TOOL_RUNTIME_UNSUPPORTED",
        message: "active runtime manifest reports unsupported runtime",
      });
    }
    if (policy.rollback.supported && !activeRuntime.manifest.rollbackSupported) {
      failures.push({
        code: "TOOL_ROLLBACK_UNSUPPORTED",
        message: "active runtime does not support required rollback behavior",
      });
    }
    if (policy.replay.supported && !activeRuntime.manifest.replaySupported) {
      failures.push({
        code: "TOOL_REPLAY_UNSUPPORTED",
        message: "active runtime does not support required replay behavior",
      });
    }
  }

  const compatibilityHash = hashRuntimeCompatibility({
    bindingHash: binding.bindingHash,
    registryHash: binding.registryHash,
    capabilityHash: binding.capabilityHash,
    sandboxProfileHash: binding.sandboxProfileHash,
    runtimeAuthorityLockHash: binding.runtimeAuthorityLockHash,
    replayContainmentHash: binding.replayContainmentHash,
    governanceHash: binding.governanceHash,
    lineageHash: binding.lineageHash,
    provenanceHash: binding.provenanceHash,
    evidenceHash: binding.evidenceHash,
    adapterId: activeRuntime.adapter.adapterId,
    policyId: activeRuntime.policy.policyId,
  });

  return {
    valid: failures.length === 0,
    failures,
    compatibilityHash,
  };
}
