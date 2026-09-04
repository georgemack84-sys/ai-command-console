import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { EpistemicSynthesisArtifactRecord, EpistemicSynthesisArtifactStore } from "../../types/learning-constitution/epistemicSynthesis";

type Row = { artifactId: string; workspaceId: string; artifactType: EpistemicSynthesisArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date };
type Client = { noesisEpistemicSynthesisArtifact: { create(args: object): Promise<Row>; findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]> } };
const client = prisma as unknown as Client;
const record = (row: Row): EpistemicSynthesisArtifactRecord => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() });

export class PrismaEpistemicSynthesisArtifactRepository implements EpistemicSynthesisArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: EpistemicSynthesisArtifactRecord): Promise<EpistemicSynthesisArtifactRecord> { const existing = await this.db.noesisEpistemicSynthesisArtifact.findUnique({ where: { artifactId: artifact.artifactId } }); if (existing) { if (existing.workspaceId !== this.workspaceId || existing.artifactType !== artifact.artifactType || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("epistemic synthesis artifact id collision"); return record(existing); } await this.db.noesisEpistemicSynthesisArtifact.create({ data: { ...artifact, workspaceId: this.workspaceId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } }); return artifact; }
  async listArtifacts(subjectId: string) { return (await this.db.noesisEpistemicSynthesisArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map(record); }
  async listWorkspaceArtifacts() { return (await this.db.noesisEpistemicSynthesisArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map(record); }
}
