import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { SkillDiscoveryArtifactRecord, SkillDiscoveryArtifactStore } from "../../types/learning-constitution/skillDiscovery";

type Row = { artifactId: string; workspaceId: string; artifactType: SkillDiscoveryArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisSkillDiscoveryArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const record = (row: Row): SkillDiscoveryArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

/** Phase 34 artifacts stay separate from the canonical Skill Registry until a governed later handoff. */
export class PrismaSkillDiscoveryArtifactRepository implements SkillDiscoveryArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: SkillDiscoveryArtifactRecord): Promise<SkillDiscoveryArtifactRecord> { const existing = await this.db.noesisSkillDiscoveryArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || existing.subjectId !== artifact.subjectId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("skill discovery artifact id collision"); return record(existing); } await this.db.noesisSkillDiscoveryArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string) { return (await this.db.noesisSkillDiscoveryArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(record); }
  async listWorkspaceArtifacts() { return (await this.db.noesisSkillDiscoveryArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(record); }
}
