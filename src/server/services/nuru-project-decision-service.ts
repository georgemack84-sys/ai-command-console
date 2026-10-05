import { z } from "zod";
import { type GovernanceDecision, type ProjectDecision, type VaultAuditEvent, type VaultCandidate, type VaultRecord, projectDecisionSchema, vaultAuditEventSchema } from "@/src/nuru/vault-contracts";

export const projectDecisionInputSchema = z.object({ project: z.string().trim().min(1).max(160), question: z.string().trim().min(1).max(2_000), decision: z.string().trim().min(1).max(10_000), rationale: z.string().trim().min(1).max(10_000), alternatives: z.array(z.string().trim().min(1).max(2_000)).max(50).default([]), candidateId: z.string().trim().min(1).max(160), governanceDecisionId: z.string().trim().min(1).max(160), supersedesDecisionId: z.string().trim().min(1).max(160).optional() });

export interface ProjectDecisionStore {
  readVaultRecords(): Promise<VaultRecord[]>;
  appendProjectDecision(record: ProjectDecision, supersededSnapshot: ProjectDecision | undefined, auditEvent: VaultAuditEvent): Promise<void>;
}

export class ProjectDecisionError extends Error {
  constructor(public readonly code: "CANDIDATE_NOT_FOUND" | "GOVERNANCE_DECISION_NOT_FOUND" | "GOVERNANCE_NOT_APPROVED" | "GOVERNANCE_CANDIDATE_MISMATCH" | "CURRENT_DECISION_NOT_FOUND" | "PROJECT_MISMATCH", message: string) { super(message); this.name = "ProjectDecisionError"; }
}

function latestProjectDecisions(records: VaultRecord[]) {
  const latest = new Map<string, ProjectDecision>();
  for (const record of records) if (record.kind === "PROJECT_DECISION") latest.set(record.id, record);
  return latest;
}

function approvalFor(input: z.infer<typeof projectDecisionInputSchema>, records: VaultRecord[]) {
  const candidate = records.find((record): record is VaultCandidate => record.kind === "CANDIDATE" && record.id === input.candidateId);
  if (!candidate) throw new ProjectDecisionError("CANDIDATE_NOT_FOUND", "The evidence-backed candidate for this project decision was not found.");
  const decision = records.find((record): record is GovernanceDecision => record.kind === "GOVERNANCE_DECISION" && record.id === input.governanceDecisionId);
  if (!decision) throw new ProjectDecisionError("GOVERNANCE_DECISION_NOT_FOUND", "The governance decision for this project decision was not found.");
  if (decision.outcome !== "APPROVED" || !decision.humanApprovalId) throw new ProjectDecisionError("GOVERNANCE_NOT_APPROVED", "A project decision requires an approved governance decision with recorded human approval.");
  if (decision.candidateId !== candidate.id) throw new ProjectDecisionError("GOVERNANCE_CANDIDATE_MISMATCH", "The governance decision must approve the candidate cited by this project decision.");
  return { candidate, decision };
}

/** Converts a human-approved Vault candidate into durable, versioned project memory. */
export const NuruProjectDecisionService = {
  async record(rawInput: z.input<typeof projectDecisionInputSchema>, store: ProjectDecisionStore): Promise<ProjectDecision> {
    const input = projectDecisionInputSchema.parse(rawInput);
    const records = await store.readVaultRecords();
    const { candidate, decision } = approvalFor(input, records);
    const current = input.supersedesDecisionId ? latestProjectDecisions(records).get(input.supersedesDecisionId) : undefined;
    if (input.supersedesDecisionId && (!current || current.status !== "CURRENT")) throw new ProjectDecisionError("CURRENT_DECISION_NOT_FOUND", "The project decision selected for supersession was not found or is no longer current.");
    if (current && current.project !== input.project) throw new ProjectDecisionError("PROJECT_MISMATCH", "A project decision may supersede only a current decision in the same project.");
    const id = `project-decision:${crypto.randomUUID()}`;
    const record = projectDecisionSchema.parse({ schemaVersion: candidate.schemaVersion, id, kind: "PROJECT_DECISION", classification: candidate.classification, createdAt: decision.decidedAt, correlationId: candidate.correlationId, project: input.project, question: input.question, decision: input.decision, rationale: input.rationale, alternatives: input.alternatives, candidateId: candidate.id, governanceDecisionId: decision.id, decidedAt: decision.decidedAt, version: (current?.version ?? 0) + 1, status: "CURRENT" });
    const supersededSnapshot = current && projectDecisionSchema.parse({ ...current, status: "SUPERSEDED", supersededById: record.id });
    const auditEvent = vaultAuditEventSchema.parse({ schemaVersion: record.schemaVersion, id: `audit:${record.id}:decision-recorded`, kind: "AUDIT_EVENT", classification: record.classification, createdAt: record.decidedAt, correlationId: record.correlationId, eventType: "DECISION_RECORDED", actor: "nuru.project-memory.v1", resourceId: record.id, occurredAt: record.decidedAt, reason: supersededSnapshot ? `Superseded project decision ${supersededSnapshot.id}.` : "Recorded human-approved project decision." });
    await store.appendProjectDecision(record, supersededSnapshot, auditEvent);
    return record;
  },

  async listCurrent(project: string | undefined, store: Pick<ProjectDecisionStore, "readVaultRecords">): Promise<ProjectDecision[]> {
    return [...latestProjectDecisions(await store.readVaultRecords()).values()].filter((record) => record.status === "CURRENT" && (!project || record.project === project)).sort((left, right) => left.project.localeCompare(right.project) || left.question.localeCompare(right.question));
  },

  async listEligibleApprovals(store: Pick<ProjectDecisionStore, "readVaultRecords">) {
    const records = await store.readVaultRecords();
    const candidates = new Map(records.filter((record): record is VaultCandidate => record.kind === "CANDIDATE").map((record) => [record.id, record]));
    return records.filter((record): record is GovernanceDecision => record.kind === "GOVERNANCE_DECISION" && record.outcome === "APPROVED" && Boolean(record.humanApprovalId) && candidates.has(record.candidateId)).map((decision) => ({ candidate: candidates.get(decision.candidateId) as VaultCandidate, governanceDecisionId: decision.id })).sort((left, right) => right.candidate.createdAt.localeCompare(left.candidate.createdAt));
  },
};
