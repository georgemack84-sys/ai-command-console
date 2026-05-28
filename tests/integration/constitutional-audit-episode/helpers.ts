import { detectConstitutionalAuditEpisode } from "@/services/constitutional-audit-episode";
import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditLedgerEntry,
  ConstitutionalAuditLineageLedger,
} from "@/types/constitutional-audit-episode";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

export function buildConstitutionalAuditEpisodeFixture(
  overrides: Partial<ConstitutionalAuditEpisodeInput> = {},
) {
  const futureAutonomyResult = overrides.futureAutonomyResult
    ?? buildFutureAutonomyFixture().result;
  const input: ConstitutionalAuditEpisodeInput = Object.freeze({
    episodeId: "constitutional-audit-episode-1",
    futureAutonomyResult,
    deterministicSeed: "constitutional-audit-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T15:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: detectConstitutionalAuditEpisode({
      ...input,
      existingLineage: overrides.existingLineage as ConstitutionalAuditLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ConstitutionalAuditLedgerEntry[] | undefined,
    }),
  });
}
