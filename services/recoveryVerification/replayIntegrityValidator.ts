import { validateReplayDeterminism } from "./replayDeterminismValidator";
import { validateReplayLineage } from "./replayLineageValidator";

export function validateReplayIntegrity({
  bundle,
  ledgerEvents = [],
}: {
  bundle: any;
  ledgerEvents?: any[];
}) {
  const determinism = validateReplayDeterminism({ bundle });
  const lineage = validateReplayLineage({ ledgerEvents, bundle });
  return {
    valid: determinism.valid && lineage.valid,
    evidence: [...determinism.evidence, ...lineage.evidence],
  };
}
