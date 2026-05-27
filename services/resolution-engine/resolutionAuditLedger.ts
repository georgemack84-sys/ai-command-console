import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { ResolutionAuditEvent, ResolutionFailureCode } from "./resolutionTypes";

export function buildResolutionAuditEvent(input: Omit<ResolutionAuditEvent, "eventHash">): ResolutionAuditEvent {
  const eventHash = hashStableContent("EVIDENCE_BUNDLE", {
    eventType: input.eventType,
    requestedTool: input.requestedTool,
    requestedVersion: input.requestedVersion,
    result: input.result,
    failureCode: input.failureCode ?? null,
    registryHash: input.registryHash ?? null,
    resolutionHash: input.resolutionHash ?? null,
    bindingHash: input.bindingHash ?? null,
  });

  return {
    ...input,
    eventHash,
  };
}

export function buildResolutionFailureEvent(input: {
  requestedTool: string;
  requestedVersion: string;
  failureCode: ResolutionFailureCode;
  occurredAt: string;
  registryHash?: string;
  resolutionHash?: string;
  bindingHash?: string;
}): ResolutionAuditEvent {
  return buildResolutionAuditEvent({
    eventType: "resolution.failed",
    requestedTool: input.requestedTool,
    requestedVersion: input.requestedVersion,
    result: "failure",
    failureCode: input.failureCode,
    occurredAt: input.occurredAt,
    registryHash: input.registryHash,
    resolutionHash: input.resolutionHash,
    bindingHash: input.bindingHash,
  });
}
