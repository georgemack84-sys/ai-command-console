import { describe, expect, it, vi } from "vitest";
import { sourceSchema } from "@/src/nuru/domain";

vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruSource: { upsert: vi.fn(), findUnique: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));

import { NuruSourceService } from "@/src/server/services/nuru-source-service";

describe("Nuru source model", () => {
  it("records a formal source with location, checksum, and version", async () => {
    const source = await NuruSourceService.register({ sourceId: "S-302", sourceType: "PROJECT_DOCUMENT", origin: "Nuru architecture brief", location: "docs/nuru-v1.md", author: "Owner", authority: "OWNER", version: "v1", checksum: "sha256:abc" }, "nuru.governance.v1", "source-corr");
    expect(source).toMatchObject({ sourceId: "S-302", location: "docs/nuru-v1.md", checksum: "sha256:abc", version: "v1" });
  });

  it("rejects agent output that attempts to acquire human-equivalent authority", () => {
    expect(sourceSchema.safeParse({ sourceType: "AGENT_OUTPUT", origin: "nuru.context.v1", authority: "OWNER" }).success).toBe(false);
    expect(sourceSchema.safeParse({ sourceType: "AGENT_OUTPUT", origin: "nuru.context.v1", authority: "LOW", derivedFromSourceId: "S-302" }).success).toBe(true);
  });
});
