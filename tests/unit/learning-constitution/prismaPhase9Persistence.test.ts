import { describe, expect, it } from "vitest";

import { PrismaAuthorityBindingRepository, PrismaRegistryVersionProvider } from "@/services/learning-constitution";

const authorityRecord = { authorityId: "authority-1", authorityType: "HUMAN_DECISION" as const, authoritySource: "message:1", sourceIdentity: "user:owner", scope: { type: "PROJECT" as const, id: "noesis" }, establishedAt: "2026-08-31T00:00:00.000Z", effectiveFrom: "2026-08-31T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "obs-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user:owner", observedAt: "2026-08-31T00:00:00.000Z" } };

describe("Phase 9 Prisma persistence adapters", () => {
  it("reads only a workspace-scoped authority binding", async () => {
    const repository = new PrismaAuthorityBindingRepository({ noesisAuthorityBinding: { findUnique: async () => ({ authorityRecord }) }, noesisDurableRegistryState: { findUnique: async () => null } });
    await expect(repository.find("workspace-1", "authority-1")).resolves.toEqual(authorityRecord);
    await expect(repository.find("", "authority-1")).resolves.toBeUndefined();
  });

  it("fails closed to registry version zero until a workspace registry state exists", async () => {
    const client = { noesisAuthorityBinding: { findUnique: async () => null }, noesisDurableRegistryState: { findUnique: async () => ({ version: 7 }) } };
    await expect(new PrismaRegistryVersionProvider("workspace-1", client).currentVersion()).resolves.toBe("7");
    await expect(new PrismaRegistryVersionProvider("", client).currentVersion()).rejects.toThrow("workspace scope");
  });
});
