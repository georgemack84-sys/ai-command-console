import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, RetentionAuditService, RetentionEngineService, RetentionFailureService } from "@/services/learning-constitution";
import type { RetentionArtifactRecord, RetentionArtifactStore, RetentionEvidence, RetentionRecord } from "@/types/learning-constitution";

const actor = { actorId: "agent:phase33", actorType: "AGENT" as const };
const store = (): RetentionArtifactStore => { const records: RetentionArtifactRecord[] = []; return { append: async (artifact) => { records.push(artifact); return artifact; }, listArtifacts: async (subjectId) => records.filter((artifact) => artifact.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };
const at = (day: number) => new Date(Date.UTC(2026, 8, day, 12)).toISOString();
const initial: RetentionRecord = { retentionId: "RET-ACCEPT-33", skillId: "SK-ROADMAP", competencyClaimId: "CLAIM-ROADMAP", initialLearningEventId: "LEARN-ROADMAP", initialLearningAt: at(1), stage: "NOT_EVALUATED", evidenceIds: [], lastSuccessfulDemonstrationAt: null, lastFailureAt: null, nextReviewAt: null, remediationRequired: false, suspendedStage: null, createdAt: at(1), updatedAt: at(1), immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
const evidence = (record: RetentionRecord, id: string, checkpoint: RetentionEvidence["checkpoint"], outcome: RetentionEvidence["outcome"], occurredAt: string): RetentionEvidence => ({ evidenceId: id, retentionId: record.retentionId, skillId: record.skillId, checkpoint, outcome, validity: "VALID", strength: "STRONG", independentExecution: true, novelContext: checkpoint !== "IMMEDIATE", answerExposed: false, evaluationReferenceId: `EVAL:${id}`, sourceKnowledgeStatus: "ACTIVE", occurredAt, createdBy: actor, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false });

describe("Phase 33 integrated acceptance", () => {
  it("traces delayed success, adversarial failure, narrow prerequisite remediation, and governed re-evaluation", async () => {
    const artifacts = store(); const retention = new RetentionEngineService(artifacts); const failures = new RetentionFailureService(artifacts); const ledger = new InMemoryLearningAuditLedger(); const audit = new RetentionAuditService(ledger);
    await retention.start(initial);
    let state = (await retention.applyEvidence(initial, evidence(initial, "EV-IMM", "IMMEDIATE", "PASS", at(1)))).record;
    state = (await retention.applyEvidence(state, evidence(state, "EV-SHORT", "SHORT_TERM", "PASS", at(4)))).record;
    state = (await retention.applyEvidence(state, evidence(state, "EV-MED", "MEDIUM_TERM", "PASS", at(17)))).record;
    expect(state.stage).toBe("MEDIUM_TERM_RETAINED");
    const failed = evidence(state, "EV-ADV-FAIL", "ADVERSARIAL", "FAIL", at(50));
    state = (await retention.applyEvidence(state, failed)).record;
    expect(state).toMatchObject({ stage: "REMEDIATION_REQUIRED", suspendedStage: "MEDIUM_TERM_RETAINED", remediationRequired: true });
    const prerequisite = { reflectionId: "REF-33", status: "RECOMMENDED" as const, targetSkillId: "SK-DEPENDENCY", dependencyId: "DEP-33", reason: "Dependency evidence shows a weak ordering prerequisite.", evidenceIds: [failed.evidenceId] };
    const diagnosis = await failures.diagnose({ diagnosisId: "DIAG-33", record: state, evidence: failed, failureClass: "PREREQUISITE_FAILURE", prerequisite, createdAt: at(50) });
    const reflection = failures.reflectionCase({ reflectionId: "REF-33", record: state, evidence: failed, diagnosis, actor });
    const remediation = failures.remediation({ planId: "REMED-33", reflection, diagnosis, prerequisite, actor, createdAt: at(51) });
    expect(remediation).toMatchObject({ targetSkillId: "SK-DEPENDENCY", intervention: "PREREQUISITE_PRACTICE", reevaluationStrategy: "ORIGINAL_EVALUATION" });
    state = (await retention.applyEvidence(state, evidence(state, "EV-RETEST", "LONG_TERM", "PASS", at(54)))).record;
    expect(state).toMatchObject({ stage: "LONG_TERM_RETAINED", remediationRequired: false, suspendedStage: null });
    for (const [eventType, occurredAt] of [["RETENTION_RECORD_CREATED", at(1)], ["RETENTION_STAGE_ADVANCED", at(17)], ["RETENTION_FAILURE_RECORDED", at(50)], ["RETENTION_REMEDIATION_REQUIRED", at(51)], ["RETENTION_STAGE_ADVANCED", at(54)]] as const) await audit.record({ eventId: `AUDIT:${eventType}:${occurredAt}`, eventType, workspaceId: "workspace-33", retentionId: state.retentionId, skillId: state.skillId, occurredAt, actor, correlationId: "phase33-acceptance", payload: { evidenceIds: state.evidenceIds } });
    const events = await ledger.list("workspace-33");
    expect(events.map((item) => item.event.eventType)).toEqual(["RETENTION_RECORD_CREATED", "RETENTION_STAGE_ADVANCED", "RETENTION_FAILURE_RECORDED", "RETENTION_REMEDIATION_REQUIRED", "RETENTION_STAGE_ADVANCED"]);
    expect((await artifacts.listArtifacts(state.retentionId)).some((artifact) => artifact.artifactType === "FAILURE_DIAGNOSIS")).toBe(true);
  });
});
