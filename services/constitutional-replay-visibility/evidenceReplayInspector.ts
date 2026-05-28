import type { EvidenceReplayInspection } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectEvidenceReplay(input: {
  evidenceId: string;
  evidenceImmutable: boolean;
}): EvidenceReplayInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashConstitutionalReplayValue("evidence-replay-inspection", input),
  });
}
