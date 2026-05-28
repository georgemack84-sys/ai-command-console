import type { ResolutionContext, ResolutionResult } from "./resolutionTypes";
import { resolveExactToolVersion } from "./exactVersionResolver";
import { validateCapabilityResolution } from "./capabilityResolutionValidator";
import { validateRuntimeAuthorityBinding } from "./runtimeAuthorityBindingValidator";
import { validateGovernanceBinding } from "./governanceBindingValidator";
import { composeExecutionBinding } from "./compositeBindingComposer";
import { buildResolutionAuditEvent, buildResolutionFailureEvent } from "./resolutionAuditLedger";

export function resolveExecutionBinding(context: ResolutionContext): ResolutionResult {
  const attempted = buildResolutionAuditEvent({
    eventType: "resolution.attempted",
    requestedTool: context.request.requestedTool,
    requestedVersion: context.request.requestedVersion,
    result: "success",
    occurredAt: context.runtime.authorityLock.lockedAt,
  });

  const resolved = resolveExactToolVersion(context.request);
  if (!resolved.entry) {
    return {
      ok: false,
      auditEvents: [
        attempted,
        buildResolutionFailureEvent({
          requestedTool: context.request.requestedTool,
          requestedVersion: context.request.requestedVersion,
          failureCode: resolved.failures[0]?.code ?? "RESOLUTION_REJECTED",
          occurredAt: context.runtime.authorityLock.lockedAt,
        }),
      ],
      failures: resolved.failures,
    };
  }

  const capabilityFailures = validateCapabilityResolution(context.request, resolved.entry);
  const runtimeFailures = validateRuntimeAuthorityBinding(resolved.entry, context.runtime);
  const governanceFailures = validateGovernanceBinding(resolved.entry, context.governance);
  const failures = [...capabilityFailures, ...runtimeFailures, ...governanceFailures];

  if (failures.length) {
    return {
      ok: false,
      auditEvents: [
        attempted,
        buildResolutionFailureEvent({
          requestedTool: context.request.requestedTool,
          requestedVersion: context.request.requestedVersion,
          failureCode: failures[0].code,
          occurredAt: context.runtime.authorityLock.lockedAt,
          registryHash: resolved.entry.registryHash,
        }),
      ],
      failures,
    };
  }

  const binding = composeExecutionBinding(resolved.entry, context);
  const succeeded = buildResolutionAuditEvent({
    eventType: "resolution.succeeded",
    requestedTool: context.request.requestedTool,
    requestedVersion: context.request.requestedVersion,
    result: "success",
    occurredAt: context.runtime.authorityLock.lockedAt,
    registryHash: binding.registryHash,
    resolutionHash: binding.resolutionHash,
  });
  const created = buildResolutionAuditEvent({
    eventType: "binding.created",
    requestedTool: context.request.requestedTool,
    requestedVersion: context.request.requestedVersion,
    result: "success",
    occurredAt: context.runtime.authorityLock.lockedAt,
    registryHash: binding.registryHash,
    resolutionHash: binding.resolutionHash,
    bindingHash: binding.bindingHash,
  });

  return {
    ok: true,
    binding,
    resolutionHash: binding.resolutionHash,
    bindingHash: binding.bindingHash,
    auditEvents: [attempted, succeeded, created],
    failures: [],
  };
}
