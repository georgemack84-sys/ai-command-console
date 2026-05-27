import type { CoordinationContainmentAuthorityContract } from "@/types/coordination-containment";
import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { HumanSupremacyRecord } from "@/types/human-supremacy";

const AUTHORITY_MARKERS = [
  "approvalinheritance",
  "authorityinheritance",
  "governancebypass",
  "autoapprove",
  "derivedapproval",
  "inheritedapproval",
];

export function detectAuthorityExpansion(input: {
  authorityContract: CoordinationContainmentAuthorityContract;
  missionGraph: MissionGraphSnapshot;
  humanSupremacyRecord?: HumanSupremacyRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly string[] {
  const evidence: string[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      evidence.push(`authorityContract.${key}`);
    }
  }
  for (const [key, value] of Object.entries(input.missionGraph.authorityContract)) {
    if (value !== false) {
      evidence.push(`missionGraph.authorityContract.${key}`);
    }
  }
  if (input.humanSupremacyRecord) {
    for (const [key, value] of Object.entries(input.humanSupremacyRecord.authorityContract)) {
      if (value !== false) {
        evidence.push(`humanSupremacy.authorityContract.${key}`);
      }
    }
  }
  const metadataString = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of AUTHORITY_MARKERS) {
    if (metadataString.includes(marker)) {
      evidence.push(`metadata:${marker}`);
    }
  }
  return Object.freeze(evidence.sort());
}
