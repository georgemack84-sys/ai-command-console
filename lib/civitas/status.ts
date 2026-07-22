import { getCafAgents } from "@/lib/civitas/agents";
import { getApplicationMetadata } from "@/lib/civitas/applicationMetadata";
import { getCapabilityRegistry } from "@/lib/civitas/capabilityRegistry";
import { displayProfiles, getHeadlineFlowConfiguration } from "@/lib/civitas/configuration";
import { listEvidence, listTelemetry } from "@/lib/civitas/evidence";
import { listCivitasEvents } from "@/lib/civitas/eventBus";
import { getRegistrySnapshots } from "@/lib/civitas/registries";
import { cacheStats } from "@/lib/news/cache";

export function getCivitasStatus() {
  const config = getHeadlineFlowConfiguration();
  const events = listCivitasEvents();
  const evidence = listEvidence();
  const telemetry = listTelemetry();
  const agents = getCafAgents();
  return {
    generatedAt: new Date().toISOString(),
    configuration: config,
    application: getApplicationMetadata(),
    capabilities: getCapabilityRegistry(),
    registries: getRegistrySnapshots().map((registry) =>
      registry.name === "Evidence Registry"
        ? { ...registry, count: evidence.length }
        : registry.name === "Replay Registry"
          ? { ...registry, count: new Set(evidence.map((item) => item.replayId)).size }
          : registry,
    ),
    agents: agents.map((agent) => ({ id: agent.id, runtime: config.caf.agentRuntime, status: "qualified-local" })),
    displayProfiles,
    operations: {
      currentStories: 0,
      activeAgents: agents.length,
      headlineQueue: 0,
      trustQueue: config.trust.enabled ? 0 : "disabled",
      discoveryAgent: "local-provider-backed",
      visualSynchronization: "local-validated",
      replayQueue: 0,
      applicationHealth: "ok",
      providerHealth: "ok",
      newsCache: cacheStats(),
      messageBus: "local-memory",
      performance: telemetry[0]?.durationMs ?? 0,
      renderingFps: "browser-managed",
      currentSlide: "client-local",
      currentCategory: "client-local",
      eventsPerMinute: events.length,
      errors: telemetry.filter((item) => !item.success).length,
      warnings: config.mode === "local" ? 1 : 0,
      recentActivity: events.slice(0, 8),
    },
    telemetry: telemetry.slice(0, 20),
    evidence: evidence.slice(0, 20),
  };
}
