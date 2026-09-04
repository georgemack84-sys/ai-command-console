import type { SelectionOutcome, StrategyReselection } from "../../types/learning-constitution/strategySelectionEngine";
import type { StrategyEvaluation } from "../../types/learning-constitution/strategyEvaluation";
const metric = (outcome: SelectionOutcome, name: StrategyEvaluation["metrics"][number]["metric"]) => outcome.metrics.find((item) => item.metric === name && item.availability === "OBSERVED")?.value ?? null;
export type SelectionOutcomeDiagnosis = Readonly<{ outcomeId: string; status: "NO_RESELECTION_REQUIRED" | "RESELECTION_RECOMMENDED" | "HUMAN_REVIEW_REQUIRED"; failure: StrategyReselection["diagnosedFailure"] | null; reasons: readonly string[]; createdAt: string; recommendationOnly: true; executionPermissionGranted: false; authorityEffect: "UNCHANGED" }>;
/** Attributes a selection outcome before reselection. Low scores alone never mutate a strategy or active plan. */
export class SelectionOutcomeDiagnosisService {
  diagnose(input: Readonly<{ outcome: SelectionOutcome; evaluation: StrategyEvaluation; createdAt: string }>): SelectionOutcomeDiagnosis {
    if (input.outcome.status === "INVALID" || input.evaluation.status === "INVALID") return this.result(input, "HUMAN_REVIEW_REQUIRED", "INVALID_EVALUATION", ["Invalid evaluation evidence cannot support strategy reselection without human review."]);
    if (input.evaluation.prerequisiteState === "FAILED") return this.result(input, "RESELECTION_RECOMMENDED", "PREREQUISITE", ["A failed prerequisite invalidates strategy-fit inference; remediate the prerequisite first."]);
    const transfer = metric(input.outcome, "NOVEL_ACCURACY"); const retention = metric(input.outcome, "RETENTION_ACCURACY"); const calibration = metric(input.outcome, "CALIBRATION_ERROR");
    if (retention !== null && retention < 50) return this.result(input, "RESELECTION_RECOMMENDED", "RETENTION", ["Retention evidence is below the 50% review threshold."]);
    if (transfer !== null && transfer < 50) return this.result(input, "RESELECTION_RECOMMENDED", "TRANSFER", ["Novel-application evidence is below the 50% review threshold."]);
    if (calibration !== null && calibration > 25) return this.result(input, "RESELECTION_RECOMMENDED", "CALIBRATION", ["Calibration error exceeds the 25-point review threshold."]);
    return this.result(input, "NO_RESELECTION_REQUIRED", null, ["No diagnosed prerequisite, transfer, retention, calibration, or evidence-validity failure meets the reselection threshold."]);
  }
  private result(input: Readonly<{ outcome: SelectionOutcome; createdAt: string }>, status: SelectionOutcomeDiagnosis["status"], failure: StrategyReselection["diagnosedFailure"] | null, reasons: readonly string[]): SelectionOutcomeDiagnosis { return { outcomeId: input.outcome.outcomeId, status, failure, reasons, createdAt: input.createdAt, recommendationOnly: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" }; }
}
