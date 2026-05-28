import { describe, expect, it } from "vitest";
import { loadValidationCoreSources } from "./helpers";

const bannedImportPatterns = [
  /from\s+["'][^"']*(worker|queue|executor|shell|child_process|adapter)["']/i,
  /require\(["'][^"']*(worker|queue|executor|shell|child_process|adapter)["']\)/i,
];
const bannedCallPatterns = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\bdispatch\w*\s*\(/i,
  /\brunAdapter\s*\(/,
  /\binvokeAdapter\s*\(/,
];

describe("no execution behavior", () => {
  it("imports no execution runtimes or dispatch behavior", () => {
    const sources = loadValidationCoreSources();
    for (const source of sources) {
      for (const pattern of bannedImportPatterns) {
        expect(pattern.test(source.content), source.path).toBe(false);
      }
      for (const pattern of bannedCallPatterns) {
        expect(pattern.test(source.content), source.path).toBe(false);
      }
    }
  });
});
