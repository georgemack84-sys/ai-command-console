import type { ProvenanceLedger, ProvenancePhaseExitReport } from "../../types/learning-constitution/provenance";
import { provenanceTrustState, validateProvenance } from "./provenanceIntegrityValidator";

/** Read-only phase gate. It reports integrity failures; it never repairs history. */
export const assessProvenancePhaseExit = async (ledger: ProvenanceLedger): Promise<ProvenancePhaseExitReport> => {
  const durableRecords = (await ledger.getAll()).filter((record) => record.recordType === "DURABLE_KNOWLEDGE");
  const assessments = await Promise.all(durableRecords.map(async (record) => {
    const integrity = await validateProvenance(ledger, record.id);
    return { knowledgeId: record.id, integrity, trustState: provenanceTrustState(integrity) };
  }));
  return {
    phase: "PHASE_7",
    passed: assessments.every((assessment) => assessment.trustState === "TRUSTED"),
    assessments,
    durableKnowledgeCount: assessments.length,
    trustedKnowledgeCount: assessments.filter((assessment) => assessment.trustState === "TRUSTED").length,
  };
};
