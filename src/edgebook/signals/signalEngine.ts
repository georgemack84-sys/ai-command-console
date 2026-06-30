import { analyzeSignalRisk } from "../risk/riskAnalyzer";
import { createEvidenceChain } from "./evidenceChain";
import { scoreConfidence } from "./confidenceScoring";
import type { IntelligenceSignal, SignalType } from "./signalTypes";
import type { ChangeEvent } from "../ears/changeDetectionTypes";

export function createSignalFromEvents(
  signalType: SignalType,
  events: ChangeEvent[],
): { status: "RECORDED"; signal: IntelligenceSignal } | { status: "REJECTED"; reasons: string[] } {
  const evidenceChain = createEvidenceChain(events);
  if (!evidenceChain) {
    return { status: "REJECTED", reasons: ["No signal can be created without evidence."] };
  }

  const latestEvent = events[events.length - 1];
  const confidenceScore = scoreConfidence(evidenceChain);
  const risk = analyzeSignalRisk({ evidenceChain, confidenceScore });

  return {
    status: "RECORDED",
    signal: {
      signal_id: `signal_${signalType}_${latestEvent.change_event_id}`,
      signal_type: signalType,
      confidence_score: confidenceScore,
      evidence_chain: evidenceChain,
      market_id: latestEvent.market_id,
      source_ids: evidenceChain.source_ids,
      risk_tier: risk.risk_tier,
      explanation: `Detected ${signalType.replaceAll("_", " ")} from attributed market movement evidence.`,
      timestamp: latestEvent.timestamp,
      ownership_hash: latestEvent.ownership_hash,
      replay_reference: evidenceChain.evidence_id,
    },
  };
}

export function rejectUnsupportedRecommendation(text: string): { status: "VALID" } | { status: "REJECTED"; reason: string } {
  const prohibited = /\b(lock|sure bet|risk-free|guaranteed win|guarantee profit|stake|chase losses)\b/i;

  if (prohibited.test(text)) {
    return {
      status: "REJECTED",
      reason: "Unsupported betting recommendations and guaranteed-win language are blocked.",
    };
  }

  return { status: "VALID" };
}
