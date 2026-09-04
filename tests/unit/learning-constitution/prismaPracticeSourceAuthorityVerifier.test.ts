import { PrismaPracticeSourceAuthorityVerifier } from "@/services/learning-constitution";

const row = (artifactType: string, status: string, workspaceId = "workspace:1") => ({ artifactType, workspaceId, payload: { status } });
const db = (values: { knowledge?: { workspaceId: string } | null; procedure?: ReturnType<typeof row> | null; principle?: ReturnType<typeof row> | null; example?: ReturnType<typeof row> | null }) => ({
  noesisDurableKnowledgeRecord: { findUnique: async () => values.knowledge ?? null },
  noesisProcedureArtifact: { findUnique: async () => values.procedure ?? null },
  noesisPrincipleArtifact: { findUnique: async () => values.principle ?? null },
  noesisExampleArtifact: { findUnique: async () => values.example ?? null },
});

describe("Prisma practice source authority verifier", () => {
  it("accepts only current source records belonging to the workspace", async () => {
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ knowledge: { workspaceId: "workspace:1" } }) as never).verify("KNOWLEDGE", "K-1")).resolves.toBe(true);
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ procedure: row("DURABLE_PROCEDURE", "ACTIVE") }) as never).verify("PROCEDURE", "P-1")).resolves.toBe(true);
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ principle: row("DURABLE_PRINCIPLE", "ACTIVE") }) as never).verify("PRINCIPLE", "PR-1")).resolves.toBe(true);
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ example: row("APPROVAL", "APPROVED") }) as never).verify("EXAMPLE", "EX-1")).resolves.toBe(true);
  });
  it("fails closed for another workspace, inactive, and unapproved material", async () => {
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ knowledge: { workspaceId: "workspace:2" } }) as never).verify("KNOWLEDGE", "K-1")).resolves.toBe(false);
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ procedure: row("DURABLE_PROCEDURE", "SUPERSEDED") }) as never).verify("PROCEDURE", "P-1")).resolves.toBe(false);
    await expect(new PrismaPracticeSourceAuthorityVerifier("workspace:1", db({ example: row("APPROVAL", "CANDIDATE") }) as never).verify("EXAMPLE", "EX-1")).resolves.toBe(false);
  });
});
