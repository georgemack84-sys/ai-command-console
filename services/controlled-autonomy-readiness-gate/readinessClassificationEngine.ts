import type { ReadinessClassification } from "@/types/constitutional-readiness";
import type { ControlledAutonomyDomainCertification, ControlledAutonomyGateError } from "./controlledAutonomyReadinessGate";
import { hashReadinessValue } from "@/services/constitutional-readiness/readinessHashEngine";

export function normalizeGateMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function buildGateDomainCertification(input: {
  domain: ControlledAutonomyDomainCertification["domain"];
  errors: readonly ControlledAutonomyGateError[];
  hardInvalid?: boolean;
  frozen?: boolean;
  disputed?: boolean;
}): ControlledAutonomyDomainCertification {
  const classification: ReadinessClassification = input.hardInvalid
    ? "INVALID"
    : input.frozen
      ? "FROZEN"
      : input.disputed
        ? "DISPUTED"
        : input.errors.length > 0
          ? "DEGRADED"
          : "VERIFIED";
  const reasons = Object.freeze(input.errors.map((item) => item.code));
  return Object.freeze({
    domain: input.domain,
    certified: classification === "VERIFIED",
    classification,
    reasons,
    evidenceHash: hashReadinessValue(`controlled-autonomy-domain:${input.domain}`, {
      domain: input.domain,
      classification,
      reasons,
    }),
  });
}

export function classifyGateState(input: {
  inheritedClassification: ReadinessClassification;
  domains: readonly ControlledAutonomyDomainCertification[];
  errors: readonly ControlledAutonomyGateError[];
}): ReadinessClassification {
  if (input.errors.some((item) =>
    item.code.includes("ISOLATION")
    || item.code.includes("HIDDEN_EXECUTION")
    || item.code.includes("SYNTHETIC_AUTHORITY")
    || item.code.includes("PRIVILEGE")
    || item.code.includes("RECURSIVE")
    || item.code.includes("AUTHORITY_EXPANSION")
    || item.code.includes("DELEGATION")
    || item.code.includes("CAPABILITY_MUTATION"))) {
    return "INVALID";
  }
  if (input.inheritedClassification === "INVALID") {
    return "INVALID";
  }
  if (
    input.inheritedClassification === "FROZEN"
    || input.errors.some((item) =>
      item.code.includes("GOVERNANCE")
      || item.code.includes("CONTAINMENT")
      || item.code.includes("REPLAY"))) {
    return "FROZEN";
  }
  if (
    input.inheritedClassification === "DISPUTED"
    || input.domains.some((domain) => domain.classification === "DISPUTED")) {
    return "DISPUTED";
  }
  if (
    input.inheritedClassification === "DEGRADED"
    || input.domains.some((domain) => domain.classification === "DEGRADED")) {
    return "DEGRADED";
  }
  if (
    input.inheritedClassification === "CONDITIONAL"
    || input.domains.some((domain) => domain.classification === "CONDITIONAL")) {
    return "CONDITIONAL";
  }
  return "VERIFIED";
}
