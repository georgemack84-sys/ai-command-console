import { z } from "zod";
import { sourceRegistrySchema, type SourceRegistryRecord } from "@/src/nuru/source-intelligence";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { assertSafeSourceUrl } from "@/src/server/security/server-url-policy";
import { AppError } from "@/src/server/api/errors";

export const sourceReviewActions = ["APPROVE", "LIMIT", "BLOCK", "PAUSE"] as const;
export const sourceReviewActionSchema = z.enum(sourceReviewActions);
export type SourceReviewAction = z.infer<typeof sourceReviewActionSchema>;

function registryId() {
  return `NSI-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

function optionalTimestamp(value: unknown) {
  return value instanceof Date ? value.toISOString() : typeof value === "string" ? value : undefined;
}

function serialize(row: Record<string, unknown>): SourceRegistryRecord {
  return sourceRegistrySchema.parse({
    ...row,
    domain: typeof row.domain === "string" ? row.domain : undefined,
    baseUrl: typeof row.baseUrl === "string" ? row.baseUrl : undefined,
    createdAt: optionalTimestamp(row.createdAt),
    lastCheckedAt: optionalTimestamp(row.lastCheckedAt),
    lastSuccessfulFetch: optionalTimestamp(row.lastSuccessfulFetch),
  }) as SourceRegistryRecord;
}

/** Authoritative NSI registry. It is separate from monitoring configuration and artifact-level provenance. */
export const NuruSourceRegistryService = {
  async register(rawSource: z.input<typeof sourceRegistrySchema>, actor: string, correlationId: string) {
    const parsed = sourceRegistrySchema.parse(rawSource);
    const url = parsed.baseUrl ? assertSafeSourceUrl(parsed.baseUrl) : null;
    const source = sourceRegistrySchema.parse({ ...parsed, domain: parsed.domain ?? url?.hostname });
    const id = source.id ?? registryId();
    const registered = { ...source, id } as SourceRegistryRecord;
    await nuruKnowledgeRepository.nuruSourceRegistry.create({
      data: {
        ...registered,
        createdAt: registered.createdAt ? new Date(registered.createdAt) : undefined,
        lastCheckedAt: registered.lastCheckedAt ? new Date(registered.lastCheckedAt) : undefined,
        lastSuccessfulFetch: registered.lastSuccessfulFetch ? new Date(registered.lastSuccessfulFetch) : undefined,
      },
    });
    await NuruAuditService.record({
      operation: "NSI_SOURCE_REGISTERED",
      actor,
      resourceId: id,
      inputReference: registered.baseUrl ?? registered.name,
      outputReference: id,
      decision: registered.admissionState,
      reason: "Registered source identity and acquisition policy in the Nuru Source Intelligence registry.",
      correlationId,
    });
    return registered;
  },

  async get(id: string): Promise<SourceRegistryRecord | null> {
    const row = await nuruKnowledgeRepository.nuruSourceRegistry.findUnique({ where: { id } }) as Record<string, unknown> | null;
    return row ? serialize(row) : null;
  },

  async listForWorkspace(workspaceId: string): Promise<SourceRegistryRecord[]> {
    const rows = await nuruKnowledgeRepository.nuruSourceRegistry.findMany({
      where: { workspaceId },
      orderBy: [{ name: "asc" }],
    }) as Record<string, unknown>[];
    return rows.map(serialize);
  },

  async review(id: string, workspaceId: string, action: SourceReviewAction, reason: string, actor: string, correlationId: string) {
    const source = await this.get(id);
    if (!source || source.workspaceId !== workspaceId) {
      throw new AppError(404, "source_not_found", "The registered source was not found in this workspace.");
    }
    const change = {
      APPROVE: { admissionState: "APPROVED" as const, requiresReview: false, enabled: true },
      LIMIT: { admissionState: "LIMITED" as const, requiresReview: false, enabled: true },
      BLOCK: { admissionState: "BLOCKED" as const, requiresReview: false, enabled: false },
      PAUSE: { operationalState: "PAUSED" as const },
    }[action];
    const reviewed = sourceRegistrySchema.parse({ ...source, ...change }) as SourceRegistryRecord;
    await nuruKnowledgeRepository.nuruSourceRegistry.update({ where: { id }, data: change });
    await NuruAuditService.record({
      operation: "NSI_SOURCE_REVIEWED",
      actor,
      resourceId: id,
      inputReference: source.baseUrl ?? source.name,
      outputReference: id,
      decision: action,
      reason,
      correlationId,
    });
    return reviewed;
  },
};
