import type {
  AutonomyFreezeRecord,
  KillSwitchRecord,
  OverridePropagationRecord,
  SupremacyEvidence,
  SupremacyForensicExport,
  SupremacyLineageLedger,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function exportSupremacyForensics(input: {
  supremacyId: string;
  evidence: SupremacyEvidence;
  lineage: SupremacyLineageLedger;
  overridePropagation: OverridePropagationRecord;
  freeze: AutonomyFreezeRecord;
  killSwitch: KillSwitchRecord;
}): SupremacyForensicExport {
  return Object.freeze({
    exportId: hashSupremacyValue("human-supremacy-forensic-export-id", input.supremacyId),
    supremacyId: input.supremacyId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    overrideHash: input.overridePropagation.overrideHash,
    freezeHash: input.freeze.freezeHash,
    shutdownHash: input.killSwitch.shutdownHash,
    exportHash: hashSupremacyValue("human-supremacy-forensic-export", {
      supremacyId: input.supremacyId,
      evidenceHash: input.evidence.evidenceHash,
      lineageHash: input.lineage.lineageHash,
      overrideHash: input.overridePropagation.overrideHash,
      freezeHash: input.freeze.freezeHash,
      shutdownHash: input.killSwitch.shutdownHash,
    }),
  });
}
