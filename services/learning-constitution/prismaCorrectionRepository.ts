import { prisma } from "../../src/server/db/prisma";
import type { CorrectedKnowledgeCandidate, CorrectionAnalysis, CorrectionDependencyImpact, CorrectionRecord, CorrectionRegressionCase, CorrectionRepairPlan, CorrectionRepository, CorrectionRetestEvidence, CorrectionRootCauseAnalysis, SystemImprovementCandidate } from "../../types/learning-constitution/correctionLearning";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = Readonly<{ workspaceId: string; payload: unknown }>;
type CorrectionRow = Row & Readonly<{ correctionId: string }>;
type EvidenceRow = Row & Readonly<{ recordId: string; correctionId: string; recordType: string }>;
type Client = Readonly<{
  noesisCorrection: Readonly<{ findUnique(args: object): Promise<CorrectionRow | null>; findMany(args: object): Promise<CorrectionRow[]>; create(args: object): Promise<CorrectionRow> }>;
  noesisCorrectionEvidence: Readonly<{ findUnique(args: object): Promise<EvidenceRow | null>; findMany(args: object): Promise<EvidenceRow[]>; create(args: object): Promise<EvidenceRow> }>;
}>;
const client = prisma as unknown as Client;

/** Persistent append-only Phase 12 repository. The database migration rejects update/delete attempts. */
export class PrismaCorrectionRepository implements CorrectionRepository {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(record: CorrectionRecord): Promise<CorrectionRecord> {
    const existing = await this.db.noesisCorrection.findUnique({ where: { correctionId: record.correctionId } });
    if (existing) { if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(record)) throw new Error("correction id collision"); return existing.payload as CorrectionRecord; }
    await this.db.noesisCorrection.create({ data: { correctionId: record.correctionId, workspaceId: this.workspaceId, status: record.status, payload: record as object, createdAt: new Date(record.signal.timestamp) } }); return record;
  }
  async appendAnalysis(analysis: CorrectionAnalysis) { return this.appendEvidence("ANALYSIS", analysis.correctionId, analysis.analyzedAt, analysis.correctionId + ":analysis:" + analysis.analyzedAt, analysis); }
  async appendImpact(impact: CorrectionDependencyImpact) { return this.appendEvidence("IMPACT", impact.correctionId, impact.detectedAt, impact.impactId, impact); }
  async appendCandidate(candidate: CorrectedKnowledgeCandidate) { return this.appendEvidence("CANDIDATE", candidate.correctionId, candidate.extractedAt, candidate.candidateId, candidate); }
  async appendPlan(plan: CorrectionRepairPlan) { return this.appendEvidence("PLAN", plan.correctionId, plan.plannedAt, plan.planId, plan); }
  async appendRegressionCase(regressionCase: CorrectionRegressionCase) { return this.appendEvidence("REGRESSION_CASE", regressionCase.correctionId, regressionCase.createdAt, regressionCase.regressionCaseId, regressionCase); }
  async appendRetest(retest: CorrectionRetestEvidence) { return this.appendEvidence("RETEST", retest.correctionId, retest.evaluatedAt, retest.retestId, retest); }
  async appendRootCause(rootCause: CorrectionRootCauseAnalysis) { return this.appendEvidence("ROOT_CAUSE", rootCause.correctionId, rootCause.identifiedAt, rootCause.rootCauseId, rootCause); }
  async appendImprovementCandidate(candidate: SystemImprovementCandidate) { return this.appendEvidence("SYSTEM_IMPROVEMENT", candidate.correctionIds[0] ?? "", candidate.detectedAt, candidate.improvementId, candidate); }
  async get(correctionId: string): Promise<CorrectionRecord | null> {
    const row = await this.db.noesisCorrection.findUnique({ where: { correctionId } }); if (!row || row.workspaceId !== this.workspaceId) return null;
    return this.compose(row.payload as CorrectionRecord, await this.db.noesisCorrectionEvidence.findMany({ where: { workspaceId: this.workspaceId, correctionId }, orderBy: { createdAt: "asc" } }));
  }
  async list(): Promise<readonly CorrectionRecord[]> {
    const rows = await this.db.noesisCorrection.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } });
    return Promise.all(rows.map(async (row) => this.compose(row.payload as CorrectionRecord, await this.db.noesisCorrectionEvidence.findMany({ where: { workspaceId: this.workspaceId, correctionId: row.correctionId }, orderBy: { createdAt: "asc" } }))));
  }
  private async appendEvidence<T>(recordType: string, correctionId: string, createdAt: string, recordId: string, payload: T): Promise<T> {
    if (!correctionId || !(await this.getBase(correctionId))) throw new Error("correction must exist before appending evidence");
    const existing = await this.db.noesisCorrectionEvidence.findUnique({ where: { recordId } });
    if (existing) { if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(payload)) throw new Error("correction evidence id collision"); return existing.payload as T; }
    await this.db.noesisCorrectionEvidence.create({ data: { recordId, workspaceId: this.workspaceId, correctionId, recordType, payload: payload as object, createdAt: new Date(createdAt) } }); return payload;
  }
  private async getBase(correctionId: string) { const row = await this.db.noesisCorrection.findUnique({ where: { correctionId } }); return row?.workspaceId === this.workspaceId ? row : null; }
  private compose(base: CorrectionRecord, evidence: readonly EvidenceRow[]): CorrectionRecord {
    const typed = <T>(recordType: string) => evidence.filter((row) => row.recordType === recordType).map((row) => row.payload as T);
    return { ...base, analyses: typed<CorrectionAnalysis>("ANALYSIS"), impacts: typed<CorrectionDependencyImpact>("IMPACT"), candidates: typed<CorrectedKnowledgeCandidate>("CANDIDATE"), plans: typed<CorrectionRepairPlan>("PLAN"), regressionCases: typed<CorrectionRegressionCase>("REGRESSION_CASE"), retests: typed<CorrectionRetestEvidence>("RETEST"), rootCauses: typed<CorrectionRootCauseAnalysis>("ROOT_CAUSE") };
  }
}
