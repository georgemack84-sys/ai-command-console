import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createPluginRuntime, listPluginCapabilities } = require("../../services/pluginLoader.js");

function plugin(
  name: string,
  options: { hostApiVersion?: number; capabilityName?: string; capabilityVersion?: number } = {},
) {
  return {
    name,
    description: `${name} admission fixture`,
    manifest: {
      name,
      version: "1.0.0",
      hostApiVersion: options.hostApiVersion ?? 1,
      capabilities: options.capabilityName
        ? [{ name: options.capabilityName, version: options.capabilityVersion ?? 1 }]
        : [],
    },
    run: async () => "ok",
  };
}

function catalog(overrides: Record<string, unknown> = {}) {
  return {
    "workspace.list": {
      name: "workspace.list",
      version: 1,
      scope: "workspace",
      access: "read",
      sideEffects: false,
      methods: ["listWorkspaceDirectory"],
      security: { status: "qualified", evidence: ["security-test"] },
      compatibility: { status: "qualified", hostApiVersion: 1, evidence: ["compatibility-test"] },
      ...overrides,
    },
  };
}

describe("plugin capability admission", () => {
  it("publishes the qualified host capability contract", () => {
    expect(listPluginCapabilities()).toEqual([
      {
        name: "workspace.list",
        version: 1,
        scope: "workspace",
        access: "read",
        sideEffects: false,
        methods: ["listWorkspaceDirectory"],
        securityStatus: "qualified",
        compatibilityStatus: "qualified",
        hostApiVersion: 1,
      },
    ]);
  });

  it("admits only plugins targeting the current host API and capability version", () => {
    const runtime = createPluginRuntime({
      registry: {
        compatible: plugin("compatible", { capabilityName: "workspace.list" }),
        staleHost: plugin("staleHost", { hostApiVersion: 0 }),
        futureCapability: plugin("futureCapability", {
          capabilityName: "workspace.list",
          capabilityVersion: 2,
        }),
      },
      enabledPluginNames: () => ["compatible", "staleHost", "futureCapability"],
      capabilityCatalog: catalog(),
    });

    expect(runtime.listPlugins()).toEqual([
      expect.objectContaining({
        name: "compatible",
        loaded: true,
        hostApiVersion: 1,
        capabilities: ["workspace.list"],
      }),
      expect.objectContaining({ name: "staleHost", loaded: false, error: expect.stringMatching(/host API version/) }),
      expect.objectContaining({
        name: "futureCapability",
        loaded: false,
        error: expect.stringMatching(/incompatible with host version 1/),
      }),
    ]);
  });

  it("fails closed when security or compatibility qualification evidence is absent", () => {
    const candidate = plugin("candidate", { capabilityName: "workspace.list" });
    const securityRuntime = createPluginRuntime({
      registry: { candidate },
      enabledPluginNames: () => ["candidate"],
      capabilityCatalog: catalog({ security: { status: "pending", evidence: [] } }),
    });
    const compatibilityRuntime = createPluginRuntime({
      registry: { candidate },
      enabledPluginNames: () => ["candidate"],
      capabilityCatalog: catalog({ compatibility: { status: "qualified", hostApiVersion: 1, evidence: [] } }),
    });

    expect(securityRuntime.listPlugins()[0]).toEqual(
      expect.objectContaining({ loaded: false, error: expect.stringMatching(/security qualification evidence/) }),
    );
    expect(compatibilityRuntime.listPlugins()[0]).toEqual(
      expect.objectContaining({ loaded: false, error: expect.stringMatching(/compatibility qualification evidence/) }),
    );
  });

  it("rejects incomplete capability authority and method metadata", () => {
    const candidate = plugin("candidate", { capabilityName: "workspace.list" });
    const runtime = createPluginRuntime({
      registry: { candidate },
      enabledPluginNames: () => ["candidate"],
      capabilityCatalog: catalog({ scope: "", access: "unknown", sideEffects: "unknown", methods: [] }),
    });

    expect(runtime.listPlugins()[0]).toEqual(
      expect.objectContaining({ loaded: false, error: expect.stringMatching(/incomplete host contract/) }),
    );
  });

  it("rejects duplicate capability bindings before plugin execution", () => {
    const duplicate = plugin("duplicate", { capabilityName: "workspace.list" });
    duplicate.manifest.capabilities.push({ name: "workspace.list", version: 1 });
    const runtime = createPluginRuntime({
      registry: { duplicate },
      enabledPluginNames: () => ["duplicate"],
      capabilityCatalog: catalog(),
    });

    expect(runtime.listPlugins()[0]).toEqual(
      expect.objectContaining({ loaded: false, error: expect.stringMatching(/must be unique/) }),
    );
  });
});
