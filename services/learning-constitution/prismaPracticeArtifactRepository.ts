import { prisma } from "../../src/server/db/prisma";
import type { PracticeArtifactRecord, PracticeArtifactStore } from "../../types/learning-constitution/practiceEngine";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = { artifactId: string; workspaceId: string; artifactType: PracticeArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisPracticeArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const toArtifact = (row: Row): PracticeArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });
export class PrismaPracticeArtifactRepository implements PracticeArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: PracticeArtifactRecord): Promise<PracticeArtifactRecord> { const existing = await this.db.noesisPracticeArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("practice artifact id collision"); return toArtifact(existing); } await this.db.noesisPracticeArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string): Promise<readonly PracticeArtifactRecord[]> { return (await this.db.noesisPracticeArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(toArtifact); }
  async listWorkspaceArtifacts(): Promise<readonly PracticeArtifactRecord[]> { return (await this.db.noesisPracticeArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(toArtifact); }
}
