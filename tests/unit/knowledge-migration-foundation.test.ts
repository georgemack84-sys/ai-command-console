import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const foundationMigration = "2026082300035_knowledge_foundations";
const firstKnowledgeAlteration = "202608230004_knowledge_semantic_identity";

describe("Knowledge Prisma migration foundations", () => {
  it("creates the Knowledge tables and enums before any dependent alteration", () => {
    expect(foundationMigration.localeCompare(firstKnowledgeAlteration)).toBeLessThan(0);

    const source = readFileSync(
      `prisma/migrations/${foundationMigration}/migration.sql`,
      "utf8",
    );

    for (const statement of [
      'CREATE TYPE "KnowledgeScopeKind"',
      'CREATE TYPE "KnowledgeInheritance"',
      'CREATE TYPE "KnowledgePromotionStatus"',
      'CREATE TABLE IF NOT EXISTS "KnowledgeScope"',
      'CREATE TABLE IF NOT EXISTS "KnowledgeEntry"',
      'CREATE TABLE IF NOT EXISTS "KnowledgePromotion"',
    ]) {
      expect(source).toContain(statement);
    }
  });
});
