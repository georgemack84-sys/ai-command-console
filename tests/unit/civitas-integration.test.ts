import { describe, expect, it } from "vitest";
import { getCafAgents } from "@/lib/civitas/agents";
import { getApplicationMetadata } from "@/lib/civitas/applicationMetadata";
import { getCapabilityRegistry } from "@/lib/civitas/capabilityRegistry";
import { getHeadlineFlowConfiguration } from "@/lib/civitas/configuration";
import { emitCivitasEvent } from "@/lib/civitas/eventBus";
import { recordEvidence } from "@/lib/civitas/evidence";
import { getRegistrySnapshots } from "@/lib/civitas/registries";
import { getCivitasStatus } from "@/lib/civitas/status";

describe("Civitas Integration Layer", () => {
  it("registers Headline Flow capabilities for Program 1", () => {
    const capabilities = getCapabilityRegistry();
    expect(capabilities).toHaveLength(15);
    expect(capabilities.map((capability) => capability.id)).toContain("trust-evaluation");
  });

  it("provides local CAF agents with required methods", async () => {
    const agent = getCafAgents()[0];
    expect(await agent.explain({})).toContain("running locally");
    expect((await agent.qualify()).qualified).toBe(true);
  });

  it("exposes application metadata from one service", () => {
    expect(getApplicationMetadata().identity.id).toBe("civitas.app.headline-flow");
  });

  it("records immutable events and proving evidence", () => {
    const event = emitCivitasEvent("HeadlineDiscovered", { category: "top" });
    const evidence = recordEvidence("Headline ingestion", event);
    expect(event.immutable).toBe(true);
    expect(evidence.replayId).toBe(event.replayId);
  });

  it("publishes registry and configuration snapshots", () => {
    expect(getRegistrySnapshots().map((registry) => registry.name)).toContain("Replay Registry");
    expect(getHeadlineFlowConfiguration().dashboard.route).toBe("/civitas");
    expect(getCivitasStatus().agents.length).toBe(15);
  });
});
