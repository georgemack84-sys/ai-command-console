import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { CapabilityArtifactRecord, CapabilityArtifactStore } from "../../types/learning-constitution/capabilityBoundary";

type Row = { artifactId: string; workspaceId: string; artifactType: CapabilityArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisCapabilityArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const record = (row: Row): CapabilityArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

/** Capability requests and grants are workspace-scoped immutable authorization facts, separate from all learning stores. */
export class PrismaCapabilityArtifactRepository implements CapabilityArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: CapabilityArtifactRecord): Promise<CapabilityArtifactRecord> { const existing = await this.db.noesisCapabilityArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("capability artifact id collision"); return record(existing); } await this.db.noesisCapabilityArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string) { return (await this.db.noesisCapabilityArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(record); }
  async listWorkspaceArtifacts() { return (await this.db.noesisCapabilityArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(record); }
}
