import { getCapabilityRegistry } from "@/lib/civitas/capabilityRegistry";
import { getHeadlineFlowConfiguration } from "@/lib/civitas/configuration";
import { listEvidence } from "@/lib/civitas/evidence";
import type { ApplicationMetadata } from "@/lib/civitas/types";

export function getApplicationMetadata(): ApplicationMetadata {
  const config = getHeadlineFlowConfiguration();
  const evidence = listEvidence();
  return {
    identity: {
      id: "civitas.app.headline-flow",
      name: "Headline Flow",
      ecosystem: "civitas",
      independentlyDeployable: true,
    },
    manifest: {
      version: "1.0.0",
      capabilities: getCapabilityRegistry().map((capability) => capability.id),
      programs: [1, 2, 3, 4, 5, 6],
    },
    registryEntry: { status: "registered", owner: "headline-flow" },
    versionRegistry: { current: "1.0.0", channel: "mvp-reference" },
    evidence: { count: evidence.length, latest: evidence[0]?.timestamp },
    certificationStatus: config.mode === "civitas" ? "pending-civitas-certification" : "local-qualified",
    deploymentLineage: { environment: process.env.NODE_ENV || "development", mode: config.mode },
    healthStatus: "ok",
    operationalStatus: "running",
    runtimeMetadata: { generatedAt: new Date().toISOString(), provider: config.providers.news },
  };
}
