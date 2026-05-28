export const INTENT_RESOLUTION_POLICY_VERSION = "4.1E";

export const CONTEXT_REQUIREMENTS: Record<string, string[]> = {
  "service.restart": ["service", "environment", "mode"],
  "runtime.restart": ["service", "environment", "mode"],
  "network.scan.ports": ["scope"],
  "deploy.update": ["environment", "deploymentTarget", "scope", "rollbackPolicy"],
};

export const UNSAFE_ASSUMPTION_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: "UNSAFE_PRODUCTION_INFERENCE", pattern: /\bproduction\b/i },
  { code: "UNSAFE_LATEST_ARTIFACT_INFERENCE", pattern: /\blatest\b/i },
  { code: "UNSAFE_GLOBAL_SCOPE_INFERENCE", pattern: /\beverywhere\b|\ball nodes\b|\bglobal\b/i },
  { code: "UNSAFE_PRIVILEGE_INFERENCE", pattern: /\broot\b|\bforce\b/i },
  { code: "UNSAFE_CROSS_TENANT_INFERENCE", pattern: /\bcross[- ]tenant\b|\ball tenants\b/i },
  { code: "UNSAFE_DESTRUCTIVE_OVERWRITE_INFERENCE", pattern: /\bwipe\b|\boverwrite\b|\breset cluster\b/i },
];

export const NORMALIZED_ACTION_ALIASES: Record<string, string> = {
  "inspect listening sockets": "network.scan.ports",
  "check open ports": "network.scan.ports",
  "scan ports": "network.scan.ports",
};
