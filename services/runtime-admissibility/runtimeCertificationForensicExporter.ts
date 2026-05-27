import type {
  RuntimeCertificationEvidence,
  RuntimeCertificationForensicExport,
  RuntimeCertificationLineageLedger,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function exportRuntimeCertificationForensics(input: {
  admissibilityId: string;
  evidence: RuntimeCertificationEvidence;
  lineage: RuntimeCertificationLineageLedger;
  topologyHash: string;
  observabilityHash: string;
  rollbackHash: string;
}): RuntimeCertificationForensicExport {
  return Object.freeze({
    exportId: hashRuntimeCertificationValue("runtime-admissibility-export-id", input.admissibilityId),
    admissibilityId: input.admissibilityId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    topologyHash: input.topologyHash,
    observabilityHash: input.observabilityHash,
    rollbackHash: input.rollbackHash,
    exportHash: hashRuntimeCertificationValue("runtime-admissibility-export", input),
  });
}
