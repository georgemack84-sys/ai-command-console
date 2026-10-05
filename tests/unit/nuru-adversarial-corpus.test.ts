import cases from "@/tests/evals/nuru/adversarial/cases.json";
import { describe, expect, it } from "vitest";
import { NuruContentSafetyService } from "@/src/server/services/nuru-content-safety-service";
describe("Nuru adversarial corpus", () => { for (const testCase of cases) it(`contains ${testCase.id}`, () => { const result = NuruContentSafetyService.inspect({ sourceType: "PROJECT_DOCUMENT", content: testCase.content }); if (testCase.kind === "prompt_injection") expect(result.classification).toBe("UNTRUSTED_DATA_REQUIRES_REVIEW"); else expect(result.executable).toBe(false); expect(result.toolAuthority).toBe(false); }); });
