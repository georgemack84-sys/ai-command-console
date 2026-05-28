import type {
  ConstitutionalSimulationReport,
  SimulationEvidence,
  SimulationExport,
  SimulationLineageLedger,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function exportSimulationArtifacts(input: {
  simulationId: string;
  evidence: SimulationEvidence;
  lineage: SimulationLineageLedger;
  report: ConstitutionalSimulationReport;
  scenarioHash: string;
}): SimulationExport {
  return Object.freeze({
    exportId: hashSimulationValue("constitutional-runtime-simulation-export-id", input.simulationId),
    simulationId: input.simulationId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    reportHash: input.report.simulationTraceHash,
    scenarioHash: input.scenarioHash,
    exportHash: hashSimulationValue("constitutional-runtime-simulation-export", input),
  });
}
