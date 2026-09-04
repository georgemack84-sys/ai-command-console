import { prisma } from "../../src/server/db/prisma";
import { canonicalizeAuditValue } from "./auditIntegrityHash";
import type { ExampleArtifactRecord, ExampleArtifactStore } from "../../types/learning-constitution/exampleLibrary";

type Row = Readonly<{ artifactId: string; workspaceId: string; artifactType: ExampleArtifactRecord["artifactType"]; subjectId: string; payload: unknown; createdAt: Date }>;
type Client = Readonly<{ noesisExampleArtifact: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }> }>;
const client = prisma as unknown as Client;

/** Append-only repository for Phase 15 evidence. It intentionally exposes neither update nor delete. */
export class PrismaExampleArtifactRepository implements ExampleArtifactStore {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}
  async append(artifact: ExampleArtifactRecord): Promise<ExampleArtifactRecord> {
    const existing = await this.db.noesisExampleArtifact.findUnique({ where: { artifactId: artifact.artifactId } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId || canonicalizeAuditValue(existing.payload) !== canonicalizeAuditValue(artifact.payload)) throw new Error("example artifact id collision");
      return { artifactId: existing.artifactId, artifactType: existing.artifactType, subjectId: existing.subjectId, payload: existing.payload, createdAt: existing.createdAt.toISOString() };
    }
    await this.db.noesisExampleArtifact.create({ data: { artifactId: artifact.artifactId, workspaceId: this.workspaceId, artifactType: artifact.artifactType, subjectId: artifact.subjectId, payload: artifact.payload as object, createdAt: new Date(artifact.createdAt) } });
    return artifact;
  }
  async listArtifacts(subjectId: string): Promise<readonly ExampleArtifactRecord[]> {
    return (await this.db.noesisExampleArtifact.findMany({ where: { workspaceId: this.workspaceId, subjectId }, orderBy: { createdAt: "asc" } })).map((row) => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() }));
  }
  async listWorkspaceArtifacts(): Promise<readonly ExampleArtifactRecord[]> {
    return (await this.db.noesisExampleArtifact.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { createdAt: "asc" } })).map((row) => ({ artifactId: row.artifactId, artifactType: row.artifactType, subjectId: row.subjectId, payload: row.payload, createdAt: row.createdAt.toISOString() }));
  }
}
