import { describe, expect, it } from "vitest";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPolicyDecisionFixture } from "./helpers";

describe("large explanation determinism", () => {
  it("remains deterministic with larger visible traces", () => {
    const fixture = buildPolicyDecisionFixture();
    const extendedTrace = Object.freeze({
      ...fixture.request.traceView!,
      warnings: Object.freeze([
        ...fixture.request.traceView!.warnings,
        { code: "trace-governance-warning" as const, message: "warning-a" },
        { code: "trace-replay-warning" as const, message: "warning-b" },
        { code: "trace-evidence-missing" as const, message: "warning-c" },
      ]),
      evidenceView: fixture.request.traceView!.evidenceView
        ? Object.freeze({
            ...fixture.request.traceView!.evidenceView,
            items: Object.freeze([
              ...fixture.request.traceView!.evidenceView.items,
              ...fixture.request.traceView!.evidenceView.items,
            ]),
          })
        : fixture.request.traceView!.evidenceView,
    });

    const left = buildPolicyDecisionExplanation({
      ...fixture.request,
      traceView: extendedTrace,
    });
    const right = buildPolicyDecisionExplanation({
      ...fixture.request,
      traceView: extendedTrace,
    });

    expect(right).toEqual(left);
  });
});
