import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { DerivedSandboxProfile, ExecutionTrustZone, RuntimeBoundaryEnvelope } from "./enforcementTypes";

export function hashSandboxProfile(profile: DerivedSandboxProfile) {
  return hashStableContent("EXECUTION_SCOPE", profile);
}

export function hashTrustBoundary(trustZone: ExecutionTrustZone) {
  return hashStableContent("EXECUTION_SCOPE", { trustZone });
}

export function hashDerivedBoundaries(boundaries: RuntimeBoundaryEnvelope) {
  return hashStableContent("EXECUTION_SCOPE", boundaries);
}

export function hashContainmentBoundary(trustZone: ExecutionTrustZone, boundaries: RuntimeBoundaryEnvelope) {
  return hashStableContent("EXECUTION_SCOPE", {
    trustZone,
    boundaries,
  });
}
