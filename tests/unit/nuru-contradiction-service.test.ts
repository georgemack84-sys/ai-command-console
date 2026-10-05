import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruKnowledgeItem: { findMany: mocks.findMany }, nuruContradictionAssessment: { create: mocks.create } } }));

import { NuruContradictionService } from "@/src/server/services/nuru-contradiction-service";

describe("Nuru contradiction detection", () => {
  it("flags competing persistence-boundary claims for investigation without resolving them", async () => {
    mocks.findMany.mockResolvedValue([{ id: "K-102", title: "Old architecture", content: "Nuru agents may write directly to the database.", metadata: {}, contentType: "Architecture Decision", status: "ARCHIVED", project: "Nuru", source: {}, relationships: [], confidence: 0.7, currentVersion: 1, provenance: {}, createdAt: new Date() }]);
    const findings = await NuruContradictionService.assess({ itemId: "K-318", title: "Service boundary", content: "Nuru agents must access persistence only through services.", project: "Nuru" });
    expect(findings).toMatchObject([{ state: "POTENTIAL_CONTRADICTION", relatedItemId: "K-102", investigation: expect.arrayContaining(["Did the architecture change?"]) }]);
    expect(mocks.create).toHaveBeenCalled();
  });
});
