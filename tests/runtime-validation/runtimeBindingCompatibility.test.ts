import { describe, expect, it } from "vitest";

import { validateRuntimeBindingCompatibility } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("runtime binding compatibility", () => {
  it("validates matching active runtime state against immutable binding", () => {
    const result = validateRuntimeBindingCompatibility(buildRuntimeValidationFixture());
    expect(result.valid).toBe(true);
  });

  it("fails closed on adapter substitution", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeBindingCompatibility({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        adapter: {
          ...fixture.activeRuntime.adapter,
          importPath: "services/adapters/forged.ts",
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TOOL_ADAPTER_INCOMPATIBLE")).toBe(true);
  });

  it("fails closed on missing rollback support", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeBindingCompatibility({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        manifest: {
          ...fixture.activeRuntime.manifest,
          rollbackSupported: false,
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TOOL_ROLLBACK_UNSUPPORTED")).toBe(true);
  });
});
