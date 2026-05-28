import { detectAdversarialTelemetry } from "@/services/adversarial-telemetry";
import type {
  ConstitutionalTelemetryInput,
  TelemetryLedgerEntry,
  TelemetryLineageLedger,
} from "@/types/adversarial-telemetry";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

export function buildAdversarialTelemetryFixture(
  overrides: Partial<ConstitutionalTelemetryInput> = {},
) {
  const constitutionalAuditEpisodeResult = overrides.constitutionalAuditEpisodeResult
    ?? buildConstitutionalAuditEpisodeFixture().result;
  const input: ConstitutionalTelemetryInput = Object.freeze({
    telemetryId: "telemetry-1",
    constitutionalAuditEpisodeResult,
    deterministicSeed: "telemetry-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T16:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: detectAdversarialTelemetry({
      ...input,
      existingLineage: overrides.existingLineage as TelemetryLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly TelemetryLedgerEntry[] | undefined,
    }),
  });
}
