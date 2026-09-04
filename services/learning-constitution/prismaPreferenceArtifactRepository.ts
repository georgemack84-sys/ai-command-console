import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { PreferenceArtifactRecord, PreferenceArtifactStore } from "../../types/learning-constitution/preferenceLearning";
type Row = Readonly<{ artifactId: string; workspaceId: string; artifactType: PreferenceArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date }>;
type Client = Readonly<{ noesisPreferenceArtifact: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }> }>;
const client = prisma as unknown as Client;
/** Immutable Phase 16 evidence store; mutation capabilities are intentionally unavailable. */
export class PrismaPreferenceArtifactRepository implements PreferenceArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: PreferenceArtifactRecord): Promise<PreferenceArtifactRecord> { const existing = await this.db.noesisPreferenceArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("preference artifact id collision"); return { artifactId: existing.artifactId, artifactType: existing.artifactType, subjectId: existing.subjectId, payload: existing.payload, createdAt: existing.createdAt.toISOString() }; } await this.db.noesisPreferenceArtifact.create({ data: { artifactId: artifact.artifactId, workspaceId: this.workspaceId, artifactType: artifact.artifactType, subjectId: artifact.subjectId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string): Promise<readonly PreferenceArtifactRecord[]> { return (await this.db.noesisPreferenceArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map((row) => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() })); }
}
