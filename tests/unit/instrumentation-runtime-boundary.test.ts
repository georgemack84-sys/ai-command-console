import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("instrumentation runtime boundary", () => {
  it("does not pull the Node-only Sentry SDK into the Edge-compiled entry point", () => {
    const source = readFileSync("src/instrumentation.ts", "utf8");

    expect(source).not.toContain("@sentry/node");
    expect(source).not.toContain("observability/sentry");
  });

  it("loads autonomous scheduler startup only for the Node runtime", () => {
    const source = readFileSync("src/instrumentation.ts", "utf8");
    const nodeSource = readFileSync("src/instrumentation-node.ts", "utf8");

    expect(source).toContain('process.env.NEXT_RUNTIME === "nodejs"');
    expect(source).toContain('import("./instrumentation-node")');
    expect(source).not.toContain("digestScheduler");
    expect(nodeSource).toContain("ensureDigestScheduler");
  });

  it("keeps read routes free of scheduler startup and digest queue mutations", () => {
    const consoleRoute = readFileSync("app/api/console/route.ts", "utf8");
    const streamRoute = readFileSync("app/api/console/stream/route.ts", "utf8");
    const overviewRoute = readFileSync("app/api/control-center/overview/route.ts", "utf8");

    expect(consoleRoute).not.toContain("ensureDigestScheduler");
    expect(streamRoute).not.toContain("ensureDigestScheduler");
    expect(streamRoute).not.toContain("queueTerminalDigestSweep");
    expect(overviewRoute).not.toContain("ensureDigestScheduler");
  });
});
