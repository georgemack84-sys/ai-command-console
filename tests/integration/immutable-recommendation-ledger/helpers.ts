import { buildImmutableRecommendationLedger } from "@/services/immutable-recommendation-ledger/immutableRecommendationLedger";
import type { ImmutableRecommendationLedgerInput } from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import { buildRecommendationReplayFixture } from "@/tests/integration/recommendation-replay/helpers";

export function buildImmutableRecommendationLedgerFixture(
  overrides: Partial<ImmutableRecommendationLedgerInput> = {},
) {
  const replayFixture = buildRecommendationReplayFixture();
  const baseInput = {
    ledgerRunId: "immutable-recommendation-ledger-run-1",
    ledgerTimestamp: "2026-05-21T00:00:00.000Z",
    constitutionalVersion: "5.1G",
    replayInput: replayFixture.input,
    replayResult: replayFixture.result,
  } satisfies ImmutableRecommendationLedgerInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ImmutableRecommendationLedgerInput;

  return Object.freeze({
    replayFixture,
    input,
    result: buildImmutableRecommendationLedger(input),
  });
}
