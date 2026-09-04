import { prisma } from "../../src/server/db/prisma";
import type { TeachBack, TeachBackEvaluationEvidence, TeachBackHumanDecision, TeachBackHumanDecisionRepository, TeachBackRepository } from "../../types/learning-constitution/teachBack";

type Row = Readonly<{ workspaceId: string; payload: unknown }>;
type Client = Readonly<{
  noesisTeachBack: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }>;
  noesisTeachBackEvaluation: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }>;
  noesisTeachBackReview: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }>;
}>;
const client = prisma as unknown as Client;

/** Workspace-scoped immutable persistence for Phase 11 evidence; no update/delete methods exist. */
export class PrismaTeachBackRepository implements TeachBackRepository {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(teachBack: TeachBack): Promise<TeachBack> { const existing = await this.db.noesisTeachBack.findUnique({ where: { teachBackId: teachBack.teachBackId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || JSON.stringify(existing.payload) !== JSON.stringify(teachBack)) throw new Error("teach-back id collision"); return existing.payload as TeachBack; } await this.db.noesisTeachBack.create({ data: { teachBackId: teachBack.teachBackId, workspaceId: this.workspaceId, candidateId: teachBack.candidateKnowledgeId, payload: teachBack as object, createdAt: new Date(teachBack.generatedAt) } }); return teachBack; }
  async appendEvaluation(evidence: TeachBackEvaluationEvidence): Promise<TeachBackEvaluationEvidence> { const existing = await this.db.noesisTeachBackEvaluation.findUnique({ where: { evidenceId: evidence.evidenceId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || JSON.stringify(existing.payload) !== JSON.stringify(evidence)) throw new Error("teach-back evidence id collision"); return existing.payload as TeachBackEvaluationEvidence; } await this.db.noesisTeachBackEvaluation.create({ data: { evidenceId: evidence.evidenceId, workspaceId: this.workspaceId, teachBackId: evidence.teachBackId, payload: evidence as object, createdAt: new Date(evidence.createdAt) } }); return evidence; }
  async listByCandidateId(candidateKnowledgeId: string) { return (await this.db.noesisTeachBack.findMany({ where: { workspaceId: this.workspaceId, candidateId: candidateKnowledgeId }, orderBy: { createdAt: "asc" } })).map((row) => row.payload as TeachBack); }
  async listEvaluations(teachBackId: string) { return (await this.db.noesisTeachBackEvaluation.findMany({ where: { workspaceId: this.workspaceId, teachBackId }, orderBy: { createdAt: "asc" } })).map((row) => row.payload as TeachBackEvaluationEvidence); }
}

export class PrismaTeachBackHumanDecisionRepository implements TeachBackHumanDecisionRepository {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(decision: TeachBackHumanDecision): Promise<TeachBackHumanDecision> { const existing = await this.db.noesisTeachBackReview.findUnique({ where: { decisionId: decision.decisionId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || JSON.stringify(existing.payload) !== JSON.stringify(decision)) throw new Error("teach-back review id collision"); return existing.payload as TeachBackHumanDecision; } await this.db.noesisTeachBackReview.create({ data: { decisionId: decision.decisionId, workspaceId: this.workspaceId, teachBackId: decision.teachBackId, payload: decision as object, createdAt: new Date(decision.createdAt) } }); return decision; }
  async list(teachBackId: string) { return (await this.db.noesisTeachBackReview.findMany({ where: { workspaceId: this.workspaceId, teachBackId }, orderBy: { createdAt: "asc" } })).map((row) => row.payload as TeachBackHumanDecision); }
}
