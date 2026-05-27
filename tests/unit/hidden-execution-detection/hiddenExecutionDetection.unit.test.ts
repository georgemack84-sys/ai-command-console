import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture, buildHiddenExecutionInput } from "@/tests/integration/hidden-execution-detection/helpers";
import { detectHiddenExecution } from "@/services/hidden-execution-detection/hiddenExecutionDetectionEngine";

describe("hidden execution detection unit", () => {
  it("detects delayed invocation paths", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "dispatch after review and run after replay certification" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("delayed_invocation_path");
    expect(fixture.result.report.blocked).toBe(true);
  });

  it("detects scheduler registration", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "schedule this later and register worker" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("scheduler_registration");
  });

  it("detects recursive orchestration", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "create follow-up proposal automatically" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("recursive_orchestration");
  });

  it("detects retry loops", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "retry until successful with exponential backoff" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("retry_loop");
  });

  it("detects hidden adapters", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ adapterId: "bind adapter after approval" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("hidden_adapter");
  });

  it("detects unauthorized queues", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ queueName: "enqueue recommendation into job queue" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("unauthorized_queue");
  });

  it("detects implicit dispatch semantics", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "dispatch when confidence > 0.9" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("implicit_dispatch_semantics");
  });

  it("detects runtime mutation pathways", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "mutate policy snapshot and update governance contract" }),
    });
    expect(fixture.result.report.detectedVectors).toContain("runtime_mutation_pathway");
  });

  it("severity classification and hashes are deterministic", () => {
    const first = detectHiddenExecution(buildHiddenExecutionInput({
      artifact: Object.freeze({ summary: "schedule this later" }),
    }));
    const second = detectHiddenExecution(buildHiddenExecutionInput({
      artifact: Object.freeze({ summary: "schedule this later" }),
    }));
    expect(first.report.severity).toBe(second.report.severity);
    expect(first.report.reportHash).toBe(second.report.reportHash);
    expect(first.report.findings[0]?.findingHash).toBe(second.report.findings[0]?.findingHash);
  });

  it("executionAuthorized is always false", () => {
    const fixture = buildHiddenExecutionFixture();
    expect(fixture.result.report.executionAuthorized).toBe(false);
    expect(fixture.result.report.findings.every((finding) => finding.executionAuthorized === false)).toBe(true);
  });
});
