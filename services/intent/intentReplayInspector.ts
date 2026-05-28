import { hashEvidence } from "@/services/audit/evidenceHashing";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { buildStructuredIntent } from "./intentStabilizer";
import { getIntentHistory } from "./intentPersistence";
import { rebuildIntentLifecycle, rebuildIntentReplayHash, reconstructIntentState } from "./intentStateRebuilder";
import { appendSemanticReplayAudit } from "./semanticAudit";

export function detectSemanticDrift(intentId: string) {
  const history = getIntentHistory(intentId);
  const replayed = buildStructuredIntent({
    intentId: history.intent.intentId,
    rawInput: history.intent.rawInput,
    createdAt: history.intent.createdAt,
  });
  const reasons = [
    ...(replayed.intent.action !== history.intent.intent.action ? [INTENT_ERROR_CODES.INTENT_SEMANTIC_DRIFT] : []),
    ...(replayed.intent.target !== history.intent.intent.target ? [INTENT_ERROR_CODES.INTENT_SEMANTIC_DRIFT] : []),
  ];
  return {
    intentId,
    driftDetected: reasons.length > 0,
    reasons,
  };
}

export function detectTaxonomyDrift(intentId: string) {
  const history = getIntentHistory(intentId);
  return {
    intentId,
    driftDetected: history.intent.taxonomyVersion !== "4.1A",
    reasons: history.intent.taxonomyVersion !== "4.1A" ? [INTENT_ERROR_CODES.INTENT_TAXONOMY_CORRUPTED] : [],
  };
}

export function detectConfidenceDrift(intentId: string) {
  const history = getIntentHistory(intentId);
  const replayed = buildStructuredIntent({
    intentId: history.intent.intentId,
    rawInput: history.intent.rawInput,
    createdAt: history.intent.createdAt,
  });
  const drift = Math.abs(replayed.confidence - history.intent.confidence) > 0.001;
  return {
    intentId,
    driftDetected: drift,
    reasons: drift ? [INTENT_ERROR_CODES.INTENT_CONFIDENCE_DRIFT] : [],
  };
}

export function verifyIntentReplayIntegrity(intentId: string) {
  const lifecycle = rebuildIntentLifecycle(intentId);
  const semantic = detectSemanticDrift(intentId);
  const taxonomy = detectTaxonomyDrift(intentId);
  const confidence = detectConfidenceDrift(intentId);
  const history = getIntentHistory(intentId);
  const reconstructedState = reconstructIntentState(intentId);
  const lifecycleHash = lifecycle.lifecycleHash;
  const replayHash = rebuildIntentReplayHash(intentId);

  const reasons = [
    ...semantic.reasons,
    ...taxonomy.reasons,
    ...confidence.reasons,
    ...(reconstructedState !== history.intent.lifecycleState ? [INTENT_ERROR_CODES.INTENT_REPLAY_MISMATCH] : []),
    ...(replayHash !== history.intent.replayHash ? [INTENT_ERROR_CODES.INTENT_REPLAY_MISMATCH] : []),
    ...(lifecycle.eventCount === 0 ? [INTENT_ERROR_CODES.INTENT_REPLAY_FAILED] : []),
  ];

  appendSemanticReplayAudit({
    intentId,
    driftDetected: reasons.length > 0,
    reasons,
  });

  return {
    intentId,
    deterministic: reasons.length === 0,
    driftDetected: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
    lifecycleHash: hashEvidence({ lifecycleHash, replayHash }),
    reconstructedState,
  };
}
