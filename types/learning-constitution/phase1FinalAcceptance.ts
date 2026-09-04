import type { TaxonomyExitGateReport } from "./taxonomyRelease";

export type Phase1FinalAcceptanceCheck = Readonly<{
  checkId: string;
  passed: boolean;
  detail: string;
}>;

export type Phase1FinalAcceptanceReport = Readonly<{
  phase: "PHASE_1";
  passed: boolean;
  taxonomyExitGate: TaxonomyExitGateReport;
  checks: readonly Phase1FinalAcceptanceCheck[];
  architecturalOutcome: "SEMANTIC_UNITS_TO_CLASSIFICATION_RECORD_WITHOUT_LEARNING_SIDE_EFFECTS";
}>;
