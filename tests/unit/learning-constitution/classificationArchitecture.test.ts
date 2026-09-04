import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const classifierDirectory = path.resolve(process.cwd(), "services/learning-constitution");

const interpretationSources = readdirSync(classifierDirectory)
  .filter((file) => file.startsWith("conservative"))
  .filter((file) => file.endsWith(".ts"))
  .map((file) => ({
    file,
    source: readFileSync(path.join(classifierDirectory, file), "utf8"),
  }));

describe("learning interpretation architecture boundary", () => {
  it("does not depend on persistence, memory, or authority mutation modules", () => {
    const prohibitedImport = /from\s+["'][^"']*(?:stores|prisma|memory|authority)[^"']*["']/i;

    for (const { file, source } of interpretationSources) {
      expect(source, `${file} imports a prohibited side-effect boundary`).not.toMatch(
        prohibitedImport,
      );
    }
  });

  it("contains no direct persistence operation", () => {
    const prohibitedOperation = /\b(?:writeFile|appendFile|prisma\.|persist\(|save\()\b/i;

    for (const { file, source } of interpretationSources) {
      expect(source, `${file} contains a direct persistence operation`).not.toMatch(
        prohibitedOperation,
      );
    }
  });
});
