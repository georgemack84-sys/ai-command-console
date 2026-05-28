import type { IntentCategory, StructuredIntent } from "@/types/intentContracts";

export const SEMANTIC_ALIAS_RESOLUTION: Record<string, { action: string; target: string; semanticMeaning: string; category: IntentCategory; governanceRisk: "safe" | "review" | "restricted" | "blocked"; parameters?: Record<string, unknown>; }> = {
  "scan ports": {
    action: "network.scan.ports",
    target: "localhost",
    semanticMeaning: "inspect open network ports on localhost",
    category: "network",
    governanceRisk: "review",
  },
  "check memory": {
    action: "system.memory.inspect",
    target: "localhost",
    semanticMeaning: "inspect system memory on localhost",
    category: "system",
    governanceRisk: "safe",
  },
  "restart app": {
    action: "service.restart",
    target: "service",
    semanticMeaning: "restart an application service",
    category: "runtime",
    governanceRisk: "restricted",
  },
  "restart the service": {
    action: "service.restart",
    target: "service",
    semanticMeaning: "restart an application service",
    category: "runtime",
    governanceRisk: "restricted",
  },
  "check open ports": {
    action: "network.scan.ports",
    target: "localhost",
    semanticMeaning: "inspect open network ports on localhost",
    category: "network",
    governanceRisk: "review",
  },
  "inspect listening sockets": {
    action: "network.scan.ports",
    target: "localhost",
    semanticMeaning: "inspect open network ports on localhost",
    category: "network",
    governanceRisk: "review",
  },
  "deploy the update": {
    action: "deploy.update",
    target: "unknown",
    semanticMeaning: "deploy an update to a target environment",
    category: "runtime",
    governanceRisk: "review",
  },
};

export const CONTEXTUAL_DEFAULTS: Partial<Record<IntentCategory, string>> = {
  system: "localhost",
  network: "localhost",
};

export function isContextualDefaultAllowed(input: { category: IntentCategory; action: string }) {
  return (
    (input.category === "system" && input.action === "system.memory.inspect")
    || (input.category === "network" && input.action === "network.scan.ports")
  );
}

export function evaluateGovernanceRisk(intent: StructuredIntent, canonicalAction: string) {
  if (intent.dangerous) {
    return "blocked" as const;
  }
  if (/delete|remove|wipe|shutdown|restart/.test(canonicalAction)) {
    return "restricted" as const;
  }
  if (/scan|freeze/.test(canonicalAction) || intent.confidence < 0.9) {
    return "review" as const;
  }
  return "safe" as const;
}

export function isToolCompatibleAction(action: string) {
  return [
    "filesystem.read.file",
    "filesystem.search",
    "system.memory.inspect",
    "network.scan.ports",
    "runtime.inspect",
    "governance.inspect",
    "recovery.inspect",
    "diagnostics.inspect",
  ].includes(action);
}
