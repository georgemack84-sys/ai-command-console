import { prisma } from "../../src/server/db/prisma";
import type { SkillArtifactRecord, SkillArtifactStore } from "../../types/learning-constitution/skillRegistry";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = { artifactId: string; workspaceId: string; artifactType: SkillArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisSkillArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const toArtifact = (row: Row): SkillArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

/** Immutable artifact repository. Replays are idempotent, but altered records fail closed. */
export class PrismaSkillArtifactRepository implements SkillArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: SkillArtifactRecord): Promise<SkillArtifactRecord> {
    const existing = await this.db.noesisSkillArtifact.findUnique({ where: { artifactId: artifact.artifactId } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("skill artifact id collision");
      return toArtifact(existing);
    }
    await this.db.noesisSkillArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } });
    return artifact;
  }
  async listArtifacts(subjectId: string): Promise<readonly SkillArtifactRecord[]> { return (await this.db.noesisSkillArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(toArtifact); }
  async listWorkspaceArtifacts(): Promise<readonly SkillArtifactRecord[]> { return (await this.db.noesisSkillArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(toArtifact); }
}
