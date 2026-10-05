import { afterAll, beforeAll, describe, expect, it } from "vitest";

const requested = process.env.NURU_RUN_DATABASE_INTEGRATION === "true";
const testDatabaseUrl = process.env.NURU_TEST_DATABASE_URL?.trim() ?? "";
if (requested && !testDatabaseUrl) throw new Error("Nuru privacy-reset integration requires NURU_TEST_DATABASE_URL so it cannot use the normal development database.");
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl;
const databaseName = (() => { try { return new URL(testDatabaseUrl).pathname.replace(/^\//, ""); } catch { return ""; } })();
const dedicatedDatabase = /(?:^|[_-])(test|testing|ci)(?:[_-]|$)/i.test(databaseName);
if (requested && !dedicatedDatabase) throw new Error("Nuru privacy-reset integration requires NURU_TEST_DATABASE_URL whose database name is explicitly marked test, testing, or ci.");
const enabled = requested && dedicatedDatabase;
const { prisma } = await import("@/src/server/db/prisma");
const { clearNuruData } = await import("@/src/server/services/nuru-privacy-service");
const suffix = crypto.randomUUID();
const userId = `nuru-privacy-reset-${suffix}`;
const candidateId = `nuru-privacy-candidate-${suffix}`;
const discoveryId = `nuru-privacy-discovery-${suffix}`;
let fixtureStarted = false;

/**
 * This test is intentionally opt-in: set NURU_RUN_DATABASE_INTEGRATION=true and
 * NURU_TEST_DATABASE_URL only with a dedicated test database. It never targets
 * an authenticated user or uses the normal development DATABASE_URL.
 */
describe.runIf(enabled)("Nuru privacy reset database integration", () => {
  beforeAll(async () => {
    await prisma.user.create({ data: { id: userId, email: `nuru-privacy-${suffix}@example.test`, passwordHash: "fixture-only", name: "Nuru privacy fixture" } });
    fixtureStarted = true;
    await prisma.nuruDiscoveryCandidate.create({ data: { id: candidateId, title: "Fixture candidate", content: "A fixture used only to verify the privacy reset.", source: { uri: "https://example.test/fixture" }, reasonDiscovered: "Fixture", initialType: "article", relevanceScore: 50, confidence: 0.7, status: "ELIGIBLE", createdBy: "test", correlationId: suffix, externalKey: `fixture:${suffix}` } });
    await prisma.nuruDiscovery.create({ data: { id: discoveryId, title: "Saved fixture", meta: "Fixture", category: "adjacent", matchScore: 50, imageKey: "fixture" } });
    const profile = await prisma.nuruTasteProfileSignal.create({ data: { userId, concept: "archives", dimension: "SUBJECT", polarity: 1, confidence: 0.7, evidenceCount: 1, source: "INTERVIEW" } });
    await prisma.$transaction([
      prisma.nuruTasteSignal.create({ data: { userId, nodeId: "fixture", label: "Archives", cluster: "History", score: 4 } }),
      prisma.nuruTasteInterviewResponse.create({ data: { userId, promptId: "fixture", answer: "Public archives" } }),
      prisma.nuruTasteEvidence.create({ data: { userId, signalId: profile.id, sourceType: "INTERVIEW", sourceId: "fixture", summary: "Fixture evidence", weight: 0.7 } }),
      prisma.nuruPersonalEdition.create({ data: { userId, editionDate: new Date("2026-09-17T00:00:00.000Z"), rankingVersion: "fixture", inputSnapshot: {}, items: { create: { candidateId, position: 1, lane: "FAMILIAR", score: 50, scoreBreakdown: {}, explanation: "Fixture explanation" } } } }),
      prisma.nuruPersonalEditionFeedback.create({ data: { userId, candidateId, action: "DISMISS" } }),
      prisma.nuruDiscoverTopicPreference.create({ data: { userId, topic: "archives" } }),
      prisma.nuruUserDiscoveryPreference.create({ data: { userId, discoveryId, savedAt: new Date(), dismissedAt: new Date(), affinity: "more" } }),
    ]);
  });

  afterAll(async () => {
    if (fixtureStarted) {
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.nuruDiscoveryCandidate.deleteMany({ where: { id: candidateId } });
      await prisma.nuruDiscovery.deleteMany({ where: { id: discoveryId } });
    }
    await prisma.$disconnect();
  });

  it("removes personalization history while preserving saved discoveries", async () => {
    await clearNuruData(userId, "personalization");
    const [signals, responses, profiles, evidence, editions, feedback, topics, preference] = await Promise.all([
      prisma.nuruTasteSignal.count({ where: { userId } }),
      prisma.nuruTasteInterviewResponse.count({ where: { userId } }),
      prisma.nuruTasteProfileSignal.count({ where: { userId } }),
      prisma.nuruTasteEvidence.count({ where: { userId } }),
      prisma.nuruPersonalEdition.count({ where: { userId } }),
      prisma.nuruPersonalEditionFeedback.count({ where: { userId } }),
      prisma.nuruDiscoverTopicPreference.count({ where: { userId } }),
      prisma.nuruUserDiscoveryPreference.findUnique({ where: { userId_discoveryId: { userId, discoveryId } } }),
    ]);
    expect({ signals, responses, profiles, evidence, editions, feedback, topics }).toEqual({ signals: 0, responses: 0, profiles: 0, evidence: 0, editions: 0, feedback: 0, topics: 0 });
    expect(preference).toMatchObject({ savedAt: expect.any(Date), dismissedAt: null, affinity: null });
  });
});

describe.skipIf(enabled)("Nuru privacy reset database integration", () => {
  it("requires a dedicated test-database opt-in", () => {
    expect(requested && dedicatedDatabase).toBe(false);
  });
});
