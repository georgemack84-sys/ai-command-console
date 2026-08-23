import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const servicesDirectory = path.resolve(process.cwd(), "services/learning-constitution");

describe("durable knowledge admission architecture boundary", () => {
  it("keeps durable repository dependencies out of interpretation services", () => {
    const interpretationFiles = [
      "conservativeInformationClassifier.ts",
      "conservativeKnowledgeScopeResolver.ts",
      "conservativeConflictDetector.ts",
      "conservativeKnowledgeValidator.ts",
      "conservativeLearningDecisionEngine.ts",
    ];

    for (const file of interpretationFiles) {
      const source = readFileSync(path.join(servicesDirectory, file), "utf8");
      expect(source, `${file} must not use the durable repository`).not.toMatch(
        /durableKnowledge|KnowledgeRepository|KnowledgeAuditLedger/,
      );
    }
  });

  it("limits repository use to the admission service and in-memory adapters", () => {
    const source = readFileSync(path.join(servicesDirectory, "knowledgeAdmissionService.ts"), "utf8");

    expect(source).toContain("KnowledgeRepository");
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).not.toMatch(/authority(?:Mutation|Grant|Registry)/i);
  });
});
