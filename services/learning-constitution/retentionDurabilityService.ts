import type { DurableRetentionAssessment, RetentionActivityState, RetentionActivityTransition, RetentionArtifactStore, RetentionEvidence, RetentionKnowledgeDisposition, RetentionRecord } from "../../types/learning-constitution/retentionEngine";

const delayed = new Set<RetentionEvidence["checkpoint"]>(["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "NATURAL_USE", "ADVERSARIAL", "REACTIVATION"]);

/** Aggregates evidence conservatively: durable retention needs varied delayed proof, not repeated copies of one easy test. */
export class RetentionDurabilityService {
  constructor(private readonly artifacts: RetentionArtifactStore) {}
  qualifyNaturalUse(evidence: RetentionEvidence): RetentionEvidence {
    if (evidence.checkpoint !== "NATURAL_USE") throw new Error("natural-use qualification requires NATURAL_USE evidence");
    const diagnostic = evidence.independentExecution && evidence.novelContext && !evidence.answerExposed && evidence.strength !== "WEAK";
    return diagnostic ? evidence : { ...evidence, outcome: "INCONCLUSIVE", validity: "INVALID" };
  }
  async assess(input: Readonly<{ assessmentId: string; record: RetentionRecord; evidence: readonly RetentionEvidence[]; contextKeys: ReadonlyMap<string, string>; createdAt: string }>): Promise<DurableRetentionAssessment> {
    const applicable = input.evidence.filter((item) => item.retentionId === input.record.retentionId && item.validity === "VALID" && item.sourceKnowledgeStatus === "ACTIVE" && item.outcome === "PASS" && item.independentExecution && !item.answerExposed && delayed.has(item.checkpoint));
    const adversarialPasses = applicable.filter((item) => item.checkpoint === "ADVERSARIAL").length;
    const contexts = new Set(applicable.map((item) => input.contextKeys.get(item.evidenceId)).filter((item): item is string => !!item));
    const status: DurableRetentionAssessment["status"] = input.record.remediationRequired ? "BLOCKED" : applicable.length >= 3 && adversarialPasses >= 1 && contexts.size >= 3 ? "ELIGIBLE" : "INSUFFICIENT_EVIDENCE";
    const reason = status === "ELIGIBLE" ? "Three independent delayed passes across distinct contexts, including an adversarial pass, support durable-retention review." : status === "BLOCKED" ? "Unresolved remediation blocks durable-retention assessment." : "Durable retention requires three independent delayed passes across three contexts and one adversarial pass.";
    const assessment: DurableRetentionAssessment = { retentionId: input.record.retentionId, status, independentDelayedPasses: applicable.length, adversarialPasses, distinctContexts: contexts.size, reason, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    await this.artifacts.append({ artifactId: `RETENTION_DURABILITY:${input.assessmentId}`, artifactType: "DURABILITY_ASSESSMENT", subjectId: input.record.retentionId, payload: assessment, createdAt: input.createdAt });
    return assessment;
  }

  async knowledgeDisposition(input: Readonly<{ dispositionId: string; record: RetentionRecord; knowledgeStatus: RetentionEvidence["sourceKnowledgeStatus"]; createdAt: string }>): Promise<RetentionKnowledgeDisposition> {
    const action: RetentionKnowledgeDisposition["action"] = input.knowledgeStatus === "ACTIVE" ? "CONTINUE" : input.knowledgeStatus === "SUPERSEDED" ? "CANCEL_REVIEW" : "REVALIDATE_KNOWLEDGE";
    const reason = action === "CONTINUE" ? "Knowledge remains active; a retention review may proceed." : action === "CANCEL_REVIEW" ? "Superseded knowledge must not be reinforced." : "Retired knowledge requires constitutional revalidation before any retention activity.";
    const disposition: RetentionKnowledgeDisposition = { retentionId: input.record.retentionId, action, reason, retentionEffect: "NONE", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    await this.artifacts.append({ artifactId: `RETENTION_KNOWLEDGE_DISPOSITION:${input.dispositionId}`, artifactType: "KNOWLEDGE_DISPOSITION", subjectId: input.record.retentionId, payload: disposition, createdAt: input.createdAt });
    return disposition;
  }

  async transitionActivity(input: Readonly<{ transitionId: string; record: RetentionRecord; from: RetentionActivityState; to: RetentionActivityState; createdAt: string }>): Promise<RetentionActivityTransition> {
    const permitted = (input.from === "ACTIVE" && ["MAINTENANCE", "DORMANT"].includes(input.to)) || (input.from === "MAINTENANCE" && ["ACTIVE", "DORMANT"].includes(input.to)) || (input.from === "DORMANT" && input.to === "REACTIVATING") || (input.from === "REACTIVATING" && ["ACTIVE", "MAINTENANCE"].includes(input.to));
    if (!permitted) throw new Error("invalid retention activity transition");
    const reason = input.to === "REACTIVATING" ? "Dormant competency requires a reactivation evaluation before use." : input.to === "DORMANT" ? "Competency is inactive; retention is neither confirmed nor revoked by dormancy." : "Activity state changed after governed retention evidence.";
    const transition: RetentionActivityTransition = { retentionId: input.record.retentionId, from: input.from, to: input.to, reason, createdAt: input.createdAt, executionPermissionGranted: false, durableKnowledgeEffect: "NONE" };
    await this.artifacts.append({ artifactId: `RETENTION_ACTIVITY:${input.transitionId}`, artifactType: "ACTIVITY_TRANSITION", subjectId: input.record.retentionId, payload: transition, createdAt: input.createdAt });
    return transition;
  }
}
