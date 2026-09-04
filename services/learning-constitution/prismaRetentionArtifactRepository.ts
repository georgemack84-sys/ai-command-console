import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { RetentionArtifactRecord, RetentionArtifactStore } from "../../types/learning-constitution/retentionEngine";

type Row = { artifactId: string; workspaceId: string; artifactType: RetentionArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisRetentionArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const record = (row: Row): RetentionArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

/** Workspace-scoped append-only artifact persistence for Phase 33 retention facts. */
export class PrismaRetentionArtifactRepository implements RetentionArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: RetentionArtifactRecord): Promise<RetentionArtifactRecord> { const existing = await this.db.noesisRetentionArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("retention artifact id collision"); return record(existing); } await this.db.noesisRetentionArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string) { return (await this.db.noesisRetentionArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(record); }
  async listWorkspaceArtifacts() { return (await this.db.noesisRetentionArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(record); }
}
