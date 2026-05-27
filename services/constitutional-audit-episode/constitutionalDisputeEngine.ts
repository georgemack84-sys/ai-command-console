import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalDisputeRecord,
  ConstitutionalAuditError,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

function mapCategory(code: string): ConstitutionalDisputeRecord["category"] {
  if (code.includes("GOVERNANCE")) return "GOVERNANCE";
  if (code.includes("APPROVAL")) return "APPROVAL";
  if (code.includes("ESCALATION")) return "ESCALATION";
  if (code.includes("VALIDATOR")) return "VALIDATOR";
  if (code.includes("OPERATOR")) return "OPERATOR";
  if (code.includes("LINEAGE")) return "LINEAGE";
  return "REPLAY";
}

export function detectConstitutionalDisputes(input: {
  episodeInput: ConstitutionalAuditEpisodeInput;
  errors: readonly ConstitutionalAuditError[];
}): readonly ConstitutionalDisputeRecord[] {
  const disputeCodes = input.errors.filter((item) =>
    item.code.includes("REPLAY")
    || item.code.includes("GOVERNANCE")
    || item.code.includes("APPROVAL")
    || item.code.includes("ESCALATION")
    || item.code.includes("LINEAGE")
    || item.code.includes("VALIDATOR")
    || item.code.includes("CURRENT_STATE_SUBSTITUTION"),
  );
  return Object.freeze(disputeCodes.map((item) => Object.freeze({
    disputeId: hashConstitutionalAuditValue(`constitutional-audit-dispute-id:${item.code}`, {
      episodeId: input.episodeInput.episodeId,
      createdAt: input.episodeInput.createdAt,
    }),
    episodeId: input.episodeInput.episodeId,
    state: "frozen" as const,
    category: mapCategory(item.code),
    severity: "critical" as const,
    evidenceRefs: Object.freeze([
      input.episodeInput.futureAutonomyResult.evidence.evidenceId,
      input.episodeInput.futureAutonomyResult.record.simulationId,
    ]),
    createdAt: input.episodeInput.createdAt,
    deterministicHash: hashConstitutionalAuditValue(`constitutional-audit-dispute:${item.code}`, item),
  })));
}
