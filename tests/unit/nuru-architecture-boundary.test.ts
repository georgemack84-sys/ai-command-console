import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const agentFiles = ["nuru-discovery-agent.ts", "nuru-context-agent.ts", "nuru-connection-agent.ts", "nuru-quality-agent.ts", "nuru-curator-agent.ts"];
const forbiddenImports = ["@/src/server/db", "prisma", "/repositories/", "node:fs", "node:fs/promises"];

describe("Nuru agent/service architecture boundary", () => {
  it("prevents agent modules from directly importing infrastructure", () => {
    for (const file of agentFiles) {
      const source = readFileSync(resolve(process.cwd(), "src/server/services", file), "utf8");
      for (const forbidden of forbiddenImports) expect(source, `${file} must not import ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("keeps the Nuru repository as the only module importing Prisma", () => {
    const repository = readFileSync(resolve(process.cwd(), "src/server/repositories/nuru-knowledge-repository.ts"), "utf8");
    expect(repository).toContain("@/src/server/db/prisma");
  });

  it("reserves collaboration orchestration for the Curator", () => {
    for (const file of agentFiles.filter((file) => file !== "nuru-curator-agent.ts")) {
      const source = readFileSync(resolve(process.cwd(), "src/server/services", file), "utf8");
      expect(source, `${file} must not orchestrate peers`).not.toContain("NuruAgentCollaborationProtocol");
    }
  });
});
