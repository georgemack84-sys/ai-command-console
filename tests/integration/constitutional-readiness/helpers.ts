import { scoreConstitutionalReadiness } from "@/services/constitutional-readiness";
import type {
  ConstitutionalReadinessInput,
  ReadinessLedgerEntry,
  ReadinessLineageLedger,
} from "@/types/constitutional-readiness";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

export function buildConstitutionalReadinessFixture(
  overrides: Partial<ConstitutionalReadinessInput> = {},
) {
  const adversarialTelemetryResult = overrides.adversarialTelemetryResult
    ?? buildAdversarialTelemetryFixture().result;
  const input: ConstitutionalReadinessInput = Object.freeze({
    readinessId: "readiness-1",
    adversarialTelemetryResult,
    deterministicSeed: "readiness-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T18:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: scoreConstitutionalReadiness({
      ...input,
      existingLineage: overrides.existingLineage as ReadinessLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ReadinessLedgerEntry[] | undefined,
    }),
  });
}
