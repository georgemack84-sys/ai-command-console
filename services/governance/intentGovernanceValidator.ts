import { evaluateConstitutionalFreezePropagation } from "@/services/validation/constitutionalFreezePropagation";
import type { CanonicalIntent } from "@/types/semanticResolution";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";
import { resolveApprovalPolicy } from "./approvalPolicyResolver";
import { evaluateIntentRisk } from "./intentRiskEvaluator";

export function validateIntentGovernance(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
  frozen: boolean;
  replayDrift: boolean;
}) {
  const risk = evaluateIntentRisk({
    canonicalIntent: input.canonicalIntent,
    registryEntry: input.registryEntry,
  });
  const approval = resolveApprovalPolicy({
    canonicalIntent: input.canonicalIntent,
    registryEntry: input.registryEntry,
  });

  const freeze = evaluateConstitutionalFreezePropagation({
    governanceDecision:
      risk === "blocked" ? "BLOCKED"
      : input.frozen ? "FREEZE"
      : "ALLOW",
    disputed: false,
    containmentActive: false,
    constitutionalConflict: risk === "blocked",
    operatorSupremacyPreserved: true,
    immutableAuditIdPresent: true,
    driftDetected: input.replayDrift,
    versionConflict: false,
  });

  const blocked =
    risk === "blocked"
    || freeze.frozen
    || Boolean(input.registryEntry?.governanceRestrictions.blockedInFreeze && input.frozen)
    || Boolean(input.registryEntry?.governanceRestrictions.blockedInReplayDrift && input.replayDrift);

  return {
    risk,
    approvalRequired: approval.approvalRequired,
    blocked,
    freezeReasons: freeze.freezeReasons,
    reasons: [
      ...approval.reasons,
      ...(blocked && risk === "blocked" ? ["GOVERNANCE_DENIED"] : []),
      ...(input.frozen ? ["FROZEN_INTENT_BLOCKED"] : []),
      ...(input.replayDrift ? ["REPLAY_DRIFT_DETECTED"] : []),
    ],
  };
}
