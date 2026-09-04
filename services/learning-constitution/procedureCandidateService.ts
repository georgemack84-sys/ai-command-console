import type { ProcedureArtifactStore, ProcedureCandidate, ProcedureCandidateInput, ProcedureCompletenessResult, ProcedureCompletenessValidator, ProcedureTeachBack, ProcedureTeachBackEvaluation, ProcedureTeachBackEvaluator } from "../../types/learning-constitution/procedureLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Extracts only fields supplied by the caller; it deliberately does not infer missing procedural content. */
export class ProcedureCandidateService {
  constructor(private readonly validator: ProcedureCompletenessValidator, private readonly audit?: LearningAuditLedger, private readonly artifacts?: ProcedureArtifactStore) {}
  async create(input: ProcedureCandidateInput, workspaceId: string, correlationId: string): Promise<Readonly<{ candidate: ProcedureCandidate; completeness: ProcedureCompletenessResult }>> {
    if (!input.name.trim() || !input.purpose.trim() || !input.teachingEventId.trim()) throw new Error("procedure candidate requires name, purpose, and teaching event");
    const draft: ProcedureCandidate = { ...input, authority: "AGENT_INFERRED", status: "DRAFT", immutable: true, executionPermissionGranted: false };
    const completeness = this.validator.validate(draft); const candidate: ProcedureCandidate = { ...draft, status: completeness.status === "COMPLETE" ? "CANDIDATE" : "INCOMPLETE" };
    await this.artifacts?.append({ artifactId: `PROCEDURE_CANDIDATE:${candidate.procedureId}:v${candidate.version}`, artifactType: "PROCEDURE_CANDIDATE", subjectId: candidate.procedureId, payload: candidate, createdAt: candidate.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:procedure-candidate:${candidate.procedureId}:v${candidate.version}`, eventType: "PROCEDURE_CANDIDATE_CREATED", workspaceId, occurredAt: candidate.createdAt, actor: candidate.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: [candidate.teachingEventId] }, payload: { procedureId: candidate.procedureId, version: candidate.version, status: candidate.status, missingFields: completeness.missingFields, executionPermissionGranted: false } });
    return { candidate, completeness };
  }
}

/** Completeness is explicit: omitted material remains UNKNOWN, never an agent assumption. */
export class ConservativeProcedureCompletenessValidator implements ProcedureCompletenessValidator {
  validate(candidate: ProcedureCandidate): ProcedureCompletenessResult {
    const missingFields = (Object.entries(candidate.fieldStates) as [keyof ProcedureCandidate["fieldStates"], ProcedureCandidate["fieldStates"][keyof ProcedureCandidate["fieldStates"]]][]).filter(([, state]) => state === "UNKNOWN").map(([field]) => field);
    const violations: string[] = [];
    if (!candidate.steps.length) violations.push("STEPS_MISSING");
    for (const [field, values] of [["INPUTS", candidate.inputs], ["PRECONDITIONS", candidate.preconditions], ["STEPS", candidate.steps], ["DECISION_POINTS", candidate.decisionPoints], ["EXPECTED_OUTPUTS", candidate.expectedOutputs], ["FAILURE_CONDITIONS", candidate.failureConditions], ["RECOVERY", candidate.recovery], ["VERIFICATION", candidate.verification], ["EXCEPTIONS", candidate.exceptions]] as const) if (candidate.fieldStates[field] === "KNOWN" && !values.length) violations.push(`${field}_DECLARED_KNOWN_BUT_EMPTY`);
    if (candidate.steps.some((step) => !step.action.trim() || !step.provenance.sourceId.trim())) violations.push("STEP_PROVENANCE_MISSING");
    const incomplete = missingFields.length > 0 || violations.length > 0;
    return { procedureId: candidate.procedureId, status: incomplete ? "INCOMPLETE" : "COMPLETE", missingFields, violations, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}

/** Evaluates structural comprehension against the supplied procedure; it neither modifies nor approves the procedure. */
export class StructuralProcedureTeachBackEvaluator implements ProcedureTeachBackEvaluator {
  evaluate(teachBack: ProcedureTeachBack, procedure: ProcedureCandidate): ProcedureTeachBackEvaluation {
    const missingSections: string[] = []; const findings: string[] = [];
    const require = (name: string, expected: readonly unknown[], actual: readonly string[]) => { if (expected.length && !actual.length) missingSections.push(name); };
    if (!teachBack.purpose.trim()) missingSections.push("PURPOSE");
    require("INPUTS", procedure.inputs, teachBack.inputs); require("PRECONDITIONS", procedure.preconditions, teachBack.preconditions); require("STEPS", procedure.steps, teachBack.steps); require("DECISION_POINTS", procedure.decisionPoints, teachBack.decisions); require("EXPECTED_OUTPUTS", procedure.expectedOutputs, teachBack.expectedOutputs); require("FAILURE_CONDITIONS", procedure.failureConditions, teachBack.failures); require("RECOVERY", procedure.recovery, teachBack.recovery); require("VERIFICATION", procedure.verification, teachBack.verification); require("EXCEPTIONS", procedure.exceptions, teachBack.exceptions);
    if (teachBack.procedureId !== procedure.procedureId) findings.push("PROCEDURE_ID_MISMATCH");
    if (procedure.status === "INCOMPLETE" && !teachBack.uncertainties.length) findings.push("INCOMPLETE_PROCEDURE_UNCERTAINTY_MISSING");
    const outcome = findings.includes("PROCEDURE_ID_MISMATCH") ? "FAIL" : missingSections.length ? "PARTIAL" : findings.length ? "CLARIFICATION_REQUIRED" : "PASS";
    return { evaluationId: `procedure-teach-back-evaluation:${teachBack.teachBackId}`, teachBackId: teachBack.teachBackId, procedureId: procedure.procedureId, outcome, missingSections, findings: findings.length ? findings : ["PROCEDURE_COMPREHENSION_DEMONSTRATED"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
