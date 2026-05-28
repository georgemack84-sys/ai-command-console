import { describe, expect, it } from "vitest";
import { detectHiddenExecution } from "@/services/constitutional-autonomy-readiness-gate";

describe("detectHiddenExecution", () => {
  it("detects forbidden execution-shaped metadata", () => {
    const result = detectHiddenExecution({
      metadata: Object.freeze({
        schedulerId: "sched-1",
        runtimeHandle: "handle-1",
      }),
    });

    expect(result.hiddenExecutionDetected).toBe(true);
  });
});
