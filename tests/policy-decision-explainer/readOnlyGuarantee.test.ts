import { describe, expect, it } from "vitest";
import { detectPolicyExplainerMutationViolations } from "@/services/policy-decision-explainer";
import { loadPolicyDecisionExplainerSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no forbidden execution, runtime, worker, scheduler, queue, shell, or mutating modules", () => {
    const result = detectPolicyExplainerMutationViolations({
      sourceTexts: loadPolicyDecisionExplainerSources(),
    });

    expect(result.valid).toBe(true);
  });
});
