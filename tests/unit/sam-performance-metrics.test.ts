import { beforeEach, describe, expect, it } from "vitest";

import {
  getSamPerformanceSnapshot,
  incrementSamCounter,
  recordSamDuration,
  resetSamPerformanceMetrics,
  setSamGauge,
} from "../../services/sam/performance/samPerformanceMetrics.ts";
import { measureSamAsyncDuration } from "../../services/sam/performance/samLatencyTracker.ts";

describe("sam performance metrics", () => {
  beforeEach(() => {
    resetSamPerformanceMetrics();
  });

  it("records deterministic counters, gauges, and durations", () => {
    incrementSamCounter("sam.backpressure.activations");
    incrementSamCounter("sam.backpressure.activations", 2);
    setSamGauge("sam.queue.depth", 4);
    recordSamDuration("sam.bridge.duration", 15);
    recordSamDuration("sam.bridge.duration", 5);

    const snapshot = getSamPerformanceSnapshot();
    expect(snapshot.counters["sam.backpressure.activations"]).toBe(3);
    expect(snapshot.gauges["sam.queue.depth"]).toBe(4);
    expect(snapshot.durations["sam.bridge.duration"]).toMatchObject({
      count: 2,
      totalMs: 20,
      maxMs: 15,
      lastMs: 5,
    });
  });

  it("measures async durations through the latency tracker", async () => {
    const value = await measureSamAsyncDuration(
      "sam.audit.append.duration",
      async () => "ok",
      {
        now: (() => {
          const values = [100, 118];
          return () => values.shift() ?? 118;
        })(),
      },
    );

    expect(value).toBe("ok");
    expect(getSamPerformanceSnapshot().durations["sam.audit.append.duration"]?.totalMs).toBe(18);
  });
});
