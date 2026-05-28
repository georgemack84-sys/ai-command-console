import type {
  EscalationDeterminismInput,
  EscalationSeverity,
  UncertaintySignal,
} from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";
import { hashEscalationValue } from "./escalationHashingEngine";

function severityFromTriggered(triggered: boolean, critical: boolean): EscalationSeverity {
  if (!triggered) {
    return "none";
  }
  return critical ? "critical" : "high";
}

export function classifyEscalationUncertainty(
  input: EscalationDeterminismInput,
): readonly UncertaintySignal[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  const replayMismatch = input.constitutionalReplayResult.record.classification !== "STABLE" || normalized.includes("replaymismatch");
  const governanceUncertainty = !input.constitutionalReplayResult.replayBinding.governanceBound || normalized.includes("governanceambiguity");
  const approvalAmbiguity = !input.constitutionalReplayResult.replayBinding.approvalBound || normalized.includes("approvalambiguity");
  const authorityAmbiguity = input.constitutionalAuthorityBoundaryResult.record.certificationState !== "CERTIFIED" || normalized.includes("authorityambiguity");
  const containmentInstability = input.humanSupremacyResult.record.failClosed || normalized.includes("containmentinstability");
  const confidenceCollapse = input.constitutionalReplayResult.confidenceEvolution.volatilityDetected || normalized.includes("confidencecollapse");
  const coordinationDrift = normalized.includes("coordinationdrift");
  const lineageCorruption = normalized.includes("lineagecorruption");

  const signals: readonly UncertaintySignal[] = Object.freeze([
    Object.freeze({
      domain: "replay",
      triggered: replayMismatch,
      severity: severityFromTriggered(replayMismatch, true),
      reason: replayMismatch ? "Replay mismatch or instability detected." : "Replay remained stable.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:replay", {
        escalationId: input.escalationId,
        replayMismatch,
      }),
    }),
    Object.freeze({
      domain: "governance",
      triggered: governanceUncertainty,
      severity: severityFromTriggered(governanceUncertainty, true),
      reason: governanceUncertainty ? "Governance ambiguity or detachment detected." : "Governance remained bound.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:governance", {
        escalationId: input.escalationId,
        governanceUncertainty,
      }),
    }),
    Object.freeze({
      domain: "approval",
      triggered: approvalAmbiguity,
      severity: severityFromTriggered(approvalAmbiguity, false),
      reason: approvalAmbiguity ? "Approval ambiguity detected." : "Approval lineage remained stable.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:approval", {
        escalationId: input.escalationId,
        approvalAmbiguity,
      }),
    }),
    Object.freeze({
      domain: "authority",
      triggered: authorityAmbiguity,
      severity: severityFromTriggered(authorityAmbiguity, true),
      reason: authorityAmbiguity ? "Authority ambiguity or ceiling uncertainty detected." : "Authority remained certified.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:authority", {
        escalationId: input.escalationId,
        authorityAmbiguity,
      }),
    }),
    Object.freeze({
      domain: "containment",
      triggered: containmentInstability,
      severity: severityFromTriggered(containmentInstability, true),
      reason: containmentInstability ? "Containment instability detected." : "Containment remained stable.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:containment", {
        escalationId: input.escalationId,
        containmentInstability,
      }),
    }),
    Object.freeze({
      domain: "confidence",
      triggered: confidenceCollapse,
      severity: severityFromTriggered(confidenceCollapse, false),
      reason: confidenceCollapse ? "Confidence collapse detected." : "Confidence remained stable.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:confidence", {
        escalationId: input.escalationId,
        confidenceCollapse,
      }),
    }),
    Object.freeze({
      domain: "coordination",
      triggered: coordinationDrift,
      severity: severityFromTriggered(coordinationDrift, false),
      reason: coordinationDrift ? "Coordination drift detected." : "Coordination remained bounded.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:coordination", {
        escalationId: input.escalationId,
        coordinationDrift,
      }),
    }),
    Object.freeze({
      domain: "lineage",
      triggered: lineageCorruption,
      severity: severityFromTriggered(lineageCorruption, true),
      reason: lineageCorruption ? "Escalation lineage corruption detected." : "Lineage remained intact.",
      deterministicHash: hashEscalationValue("escalation-uncertainty:lineage", {
        escalationId: input.escalationId,
        lineageCorruption,
      }),
    }),
  ]);

  return signals;
}
