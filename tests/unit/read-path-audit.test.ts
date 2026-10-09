import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { inventoryReadPaths } = require("../../scripts/audit-read-paths.cjs");

describe("read-path audit inventory", () => {
  it("classifies every GET-capable API route", () => {
    const inventory = inventoryReadPaths();
    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory).toEqual(expect.arrayContaining([
      { routePath: "console", classification: "console_read" },
      { routePath: "health", classification: "operational_exception" },
      { routePath: "v1/observability/health", classification: "versioned_observability" },
    ]));
    expect(inventory.every((route: { classification: string }) => Boolean(route.classification))).toBe(true);
  });
});
