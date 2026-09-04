import { prisma } from "../../src/server/db/prisma";
import type { PracticeSourceAuthorityVerifier, PracticeSourceKind } from "../../types/learning-constitution/practiceEngine";

type ArtifactRow = Readonly<{ workspaceId: string; artifactType: string; payload: unknown }>;
type DurableKnowledgeRow = Readonly<{ workspaceId: string }>;
type Client = Readonly<{
  noesisDurableKnowledgeRecord: Readonly<{ findUnique(args: object): Promise<DurableKnowledgeRow | null> }>;
  noesisProcedureArtifact: Readonly<{ findUnique(args: object): Promise<ArtifactRow | null> }>;
  noesisPrincipleArtifact: Readonly<{ findUnique(args: object): Promise<ArtifactRow | null> }>;
  noesisExampleArtifact: Readonly<{ findUnique(args: object): Promise<ArtifactRow | null> }>;
}>;

const client = prisma as unknown as Client;
const active = (row: ArtifactRow | null, artifactType: string): boolean =>
  row?.artifactType === artifactType && !!row.payload && typeof row.payload === "object" && (row.payload as { status?: unknown }).status === "ACTIVE";
const approvedExample = (row: ArtifactRow | null): boolean =>
  row?.artifactType === "APPROVAL" && !!row.payload && typeof row.payload === "object" && (row.payload as { status?: unknown }).status === "APPROVED";

/** Confirms source material is present and currently usable in this workspace's immutable repositories. */
export class PrismaPracticeSourceAuthorityVerifier implements PracticeSourceAuthorityVerifier {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async verify(sourceKind: PracticeSourceKind, sourceId: string): Promise<boolean> {
    if (!sourceId.trim()) return false;
    switch (sourceKind) {
      case "KNOWLEDGE": {
        const record = await this.db.noesisDurableKnowledgeRecord.findUnique({ where: { knowledgeId: sourceId } });
        return record?.workspaceId === this.workspaceId;
      }
      case "PROCEDURE": {
        const record = await this.db.noesisProcedureArtifact.findUnique({ where: { artifactId: `DURABLE_PROCEDURE:${sourceId}` } });
        return record?.workspaceId === this.workspaceId && active(record, "DURABLE_PROCEDURE");
      }
      case "PRINCIPLE": {
        const record = await this.db.noesisPrincipleArtifact.findUnique({ where: { artifactId: `DURABLE_PRINCIPLE:${sourceId}` } });
        return record?.workspaceId === this.workspaceId && active(record, "DURABLE_PRINCIPLE");
      }
      case "EXAMPLE": {
        const record = await this.db.noesisExampleArtifact.findUnique({ where: { artifactId: `EXAMPLE_APPROVAL:${sourceId}` } });
        return record?.workspaceId === this.workspaceId && approvedExample(record);
      }
    }
  }
}
