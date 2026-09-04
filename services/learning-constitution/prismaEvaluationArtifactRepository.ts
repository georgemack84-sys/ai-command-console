import { prisma } from "../../src/server/db/prisma";
import type { EvaluationArtifactRecord, EvaluationArtifactStore } from "../../types/learning-constitution/evaluationEngine";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
type Row = { artifactId: string; workspaceId: string; artifactType: EvaluationArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisEvaluationArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const record = (row: Row): EvaluationArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });
export class PrismaEvaluationArtifactRepository implements EvaluationArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: EvaluationArtifactRecord): Promise<EvaluationArtifactRecord> { const existing = await this.db.noesisEvaluationArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("evaluation artifact id collision"); return record(existing); } await this.db.noesisEvaluationArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string): Promise<readonly EvaluationArtifactRecord[]> { return (await this.db.noesisEvaluationArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(record); }
  async listWorkspaceArtifacts(): Promise<readonly EvaluationArtifactRecord[]> { return (await this.db.noesisEvaluationArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(record); }
}
