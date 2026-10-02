import { z } from "zod";

export const sourceAdmissionStates = ["APPROVED", "LIMITED", "REVIEW_REQUIRED", "BLOCKED", "UNKNOWN"] as const;
export const sourceOperationalStates = ["HEALTHY", "DEGRADED", "PAUSED"] as const;
export const sourceCategories = ["GOVERNMENT", "ACADEMIC", "OFFICIAL", "NEWS", "DOCUMENTATION", "ORGANIZATION", "COMMUNITY", "PERSONAL", "UNKNOWN"] as const;
export const sourceAuthorityClasses = ["PRIMARY", "SECONDARY", "COMMUNITY", "UNKNOWN"] as const;
export const sourceClassificationContexts = ["DIRECT_EVIDENCE", "REPORTING", "EXPERT_ANALYSIS", "COMMUNITY_ACCOUNT", "UNKNOWN"] as const;
export const sourceIngestionMethods = ["MANUAL", "WEB", "RSS", "SITEMAP", "API"] as const;
export const sourceRefreshPolicies = ["ON_DEMAND", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type SourceIngestionMethod = (typeof sourceIngestionMethods)[number];

export const sourceRegistrySchema = z.object({
  id: z.string().min(1).optional(),
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1).max(180),
  domain: z.string().trim().min(1).max(253).optional(),
  baseUrl: z.string().url().optional(),
  category: z.enum(sourceCategories),
  topics: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  authorityClass: z.enum(sourceAuthorityClasses).default("UNKNOWN"),
  ingestionMethods: z.array(z.enum(sourceIngestionMethods)).min(1),
  refreshPolicy: z.enum(sourceRefreshPolicies).default("ON_DEMAND"),
  admissionState: z.enum(sourceAdmissionStates).default("UNKNOWN"),
  operationalState: z.enum(sourceOperationalStates).default("HEALTHY"),
  enabled: z.boolean().default(true),
  requiresReview: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  lastCheckedAt: z.string().datetime().optional(),
  lastSuccessfulFetch: z.string().datetime().optional(),
}).superRefine((source, context) => {
  if (source.baseUrl) {
    const host = new URL(source.baseUrl).hostname.toLowerCase();
    if (source.domain && source.domain.toLowerCase() !== host) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["domain"], message: "Domain must match the base URL hostname." });
    }
  }
  if (source.admissionState === "APPROVED" && source.requiresReview) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["requiresReview"], message: "Approved sources cannot still require approval review." });
  }
});

export type SourceRegistryRecord = z.infer<typeof sourceRegistrySchema> & { id: string };

export class SourceIntelligencePolicyError extends Error {
  constructor(readonly code: "SOURCE_BLOCKED" | "SOURCE_NOT_APPROVED" | "SOURCE_DISABLED" | "SOURCE_PAUSED", message: string) {
    super(message);
    this.name = "SourceIntelligencePolicyError";
  }
}

/**
 * The NSI constitution is intentionally small and executable: a caller must
 * pass this check before dispatching any connector or admitting external data.
 */
export function assertSourceMayBeAcquired(source: SourceRegistryRecord, method: SourceIngestionMethod) {
  if (!source.enabled) {
    throw new SourceIntelligencePolicyError("SOURCE_DISABLED", "This source is disabled and cannot be acquired.");
  }
  if (source.operationalState === "PAUSED") {
    throw new SourceIntelligencePolicyError("SOURCE_PAUSED", "This source is paused and cannot be acquired.");
  }
  if (source.admissionState === "BLOCKED") {
    throw new SourceIntelligencePolicyError("SOURCE_BLOCKED", "This source is blocked by the Nuru Source Constitution.");
  }
  if (source.admissionState === "REVIEW_REQUIRED" || source.admissionState === "UNKNOWN") {
    throw new SourceIntelligencePolicyError("SOURCE_NOT_APPROVED", "This source requires human approval before acquisition.");
  }
  if (!source.ingestionMethods.includes(method)) {
    throw new SourceIntelligencePolicyError("SOURCE_NOT_APPROVED", `The ${method} connector is not approved for this source.`);
  }
}
