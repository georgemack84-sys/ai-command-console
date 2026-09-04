import { prisma } from "../../src/server/db/prisma";
import type { SkillGraphArtifactRecord, SkillGraphArtifactStore } from "../../types/learning-constitution/skillDependencyGraph";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = { artifactId: string; workspaceId: string; artifactType: SkillGraphArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisSkillGraphArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const toArtifact = (row: Row): SkillGraphArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

/** Append-only Postgres repository; exact replays are safe and altered ones fail closed. */
export class PrismaSkillGraphArtifactRepository implements SkillGraphArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: SkillGraphArtifactRecord): Promise<SkillGraphArtifactRecord> {
    const existing = await this.db.noesisSkillGraphArtifact.findUnique({ where: { artifactId: artifact.artifactId } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("skill graph artifact id collision");
      return toArtifact(existing);
    }
    await this.db.noesisSkillGraphArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } });
    return artifact;
  }
  async listWorkspaceArtifacts(): Promise<readonly SkillGraphArtifactRecord[]> { return (await this.db.noesisSkillGraphArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(toArtifact); }
}
