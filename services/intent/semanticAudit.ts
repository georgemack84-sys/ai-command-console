import { appendIntentAudit } from "./intentAuditAppender";

export function appendSemanticParseAudit(input: {
  intentId: string;
  source: string;
  confidence: number;
  lifecycleState: string;
  warnings: string[];
}) {
  return appendIntentAudit({
    intentId: input.intentId,
    eventType: "intent.semantic_parsed",
    details: {
      source: input.source,
      confidence: input.confidence,
      lifecycleState: input.lifecycleState,
      warnings: input.warnings,
    },
  });
}

export function appendSemanticReplayAudit(input: {
  intentId: string;
  driftDetected: boolean;
  reasons: string[];
}) {
  return appendIntentAudit({
    intentId: input.intentId,
    eventType: "intent.semantic_replay",
    details: {
      driftDetected: input.driftDetected,
      reasons: input.reasons,
    },
  });
}
