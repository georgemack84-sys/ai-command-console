import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("adversarial runtime validation", () => {
  it("rejects runtime authority lock mutation", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeEnvironment({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        runtime: {
          ...fixture.activeRuntime.runtime,
          authorityLock: {
            ...fixture.activeRuntime.runtime.authorityLock,
            lockHash: "forged",
          },
        },
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_AUTHORITY_DRIFT")).toBe(true);
  });

  it("rejects replay under altered sandbox", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeEnvironment({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        runtime: {
          ...fixture.activeRuntime.runtime,
          envelope: {
            ...fixture.activeRuntime.runtime.envelope,
            sandboxProfileHash: "altered",
          },
        },
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_SANDBOX_DRIFT")).toBe(true);
  });

  it("rejects lineage, provenance, and evidence mutation", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeEnvironment({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        governance: {
          ...fixture.activeRuntime.governance,
          lineageNode: {
            ...fixture.activeRuntime.governance.lineageNode,
            lineageHash: "forged-lineage",
          },
          provenanceHash: "forged-provenance",
          evidenceBundle: {
            ...fixture.activeRuntime.governance.evidenceBundle,
            evidenceHash: "forged-evidence",
          },
        },
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_GOVERNANCE_DRIFT" || failure.code === "RUNTIME_BINDING_INVALIDATED")).toBe(true);
  });
});
