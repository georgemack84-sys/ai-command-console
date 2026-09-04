import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { ProcedureArtifactRecord, ProcedureArtifactStore } from "../../types/learning-constitution/procedureLearning";

export type ProcedureArtifact = ProcedureArtifactRecord;
type Row = Readonly<{ artifactId: string; workspaceId: string; artifactType: string; subjectId: string; payload: unknown; createdAt: Date }>;
type Client = Readonly<{ noesisProcedureArtifact: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }> }>;
const client = prisma as unknown as Client;

/** Generic immutable persistence spine for Phase 14 artifacts; update/delete capabilities are absent. */
export class PrismaProcedureArtifactRepository implements ProcedureArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: ProcedureArtifact): Promise<ProcedureArtifact> {
    const existing = await this.db.noesisProcedureArtifact.findUnique({ where: { artifactId: artifact.artifactId } });
    if (existing) { if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("procedure artifact id collision"); return { artifactId: existing.artifactId, artifactType: existing.artifactType, subjectId: existing.subjectId, payload: existing.payload, createdAt: existing.createdAt.toISOString() }; }
    await this.db.noesisProcedureArtifact.create({ data: { artifactId: artifact.artifactId, workspaceId: this.workspaceId, artifactType: artifact.artifactType, subjectId: artifact.subjectId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact;
  }
  async listArtifacts(subjectId: string): Promise<readonly ProcedureArtifact[]> { return (await this.db.noesisProcedureArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map((row) => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() })); }
}
