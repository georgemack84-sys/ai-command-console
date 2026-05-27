import type {
  CorrelationLineageLedger,
  CorrelationReplayBinding,
  CorrelationResult,
  IntentCorrelationError,
} from "@/types/intent-correlation-engine";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

export function reconstructCorrelationReplay(input: {
  result: CorrelationResult;
  replayBinding: CorrelationReplayBinding;
  lineage: CorrelationLineageLedger;
}): Readonly<{
  replayViewHash: string;
  errors: readonly IntentCorrelationError[];
}> {
  const valid =
    input.lineage.entries.length > 0
    && input.result.replayBindings.some((binding) => binding.bindingHash === input.replayBinding.bindingHash)
    && input.lineage.entries[input.lineage.entries.length - 1]?.replayBindingId === input.replayBinding.replayBindingId;

  return Object.freeze({
    replayViewHash: hashCorrelationValue("intent-correlation-replay-view", {
      resultHash: input.result.resultHash,
      replayBindingHash: input.replayBinding.bindingHash,
      ledgerId: input.lineage.ledgerId,
    }),
    errors: Object.freeze(
      valid
        ? []
        : [createCorrelationError("PHASE_4_6B_CORRELATION_REPLAY_MISMATCH", "Correlation replay reconstruction rejected due to binding or lineage drift.", "replay")],
    ),
  });
}
