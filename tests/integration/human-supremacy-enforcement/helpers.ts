import { enforceHumanSupremacyGrid } from "@/services/human-supremacy-enforcement/supremacyEnforcementGrid";
import type {
  HumanSupremacyEnforcementInput,
  SupremacyLedgerEntry,
  SupremacyLineageLedger,
} from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

export function buildHumanSupremacyEnforcementFixture(
  overrides: Partial<HumanSupremacyEnforcementInput> = {},
) {
  const constitutionalReplayResult = overrides.constitutionalReplayResult
    ?? buildConstitutionalReplayStabilityFixture().result;
  const input: HumanSupremacyEnforcementInput = Object.freeze({
    supremacyId: "human-supremacy-1",
    constitutionalReplayResult,
    operatorId: "operator-1",
    interventionType: "override",
    reason: "Operator override required for constitutional safety.",
    deterministicSeed: "human-supremacy-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T22:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: enforceHumanSupremacyGrid({
      ...input,
      existingLineage: overrides.existingLineage as SupremacyLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly SupremacyLedgerEntry[] | undefined,
    }),
  });
}
