import { z } from "zod";
import { assertSafeSourceUrl } from "@/src/server/security/server-url-policy";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

const signal = z.number().int().min(0).max(100);
export const urlFrontierInputSchema = z.object({ workspaceId: z.string().min(1), sourceRegistryId: z.string().min(1), url: z.string().url(), topicRelevance: signal.default(50), freshness: signal.default(50), changeProbability: signal.default(50), crawlCost: signal.default(50), userInterest: signal.default(50) }).strict();
type FrontierModel = { upsert(args: unknown): Promise<unknown>; findMany(args: unknown): Promise<unknown[]> };
const frontier = (nuruKnowledgeRepository as unknown as { nuruUrlFrontierEntry: FrontierModel }).nuruUrlFrontierEntry;
function authoritySignal(value: unknown) { return ({ PRIMARY: 90, SECONDARY: 65, COMMUNITY: 35, UNKNOWN: 15 } as Record<string, number>)[String(value)] ?? 15; }
function priority(input: z.output<typeof urlFrontierInputSchema>, authority: number) { return Math.round(input.topicRelevance * .28 + authority * .2 + input.freshness * .16 + input.changeProbability * .16 + input.userInterest * .2 - input.crawlCost * .12); }
export const NuruUrlFrontierService = {
  async enqueue(raw: z.input<typeof urlFrontierInputSchema>, actor: string, correlationId: string) {
    const input = urlFrontierInputSchema.parse(raw); const parsed = assertSafeSourceUrl(input.url);
    const source = await nuruKnowledgeRepository.nuruSourceRegistry.findUnique({ where: { id: input.sourceRegistryId } }) as Record<string, unknown> | null;
    if (!source || source.workspaceId !== input.workspaceId) throw new AppError(404, "source_not_found", "The registered source was not found in this workspace.");
    if (!source.enabled || source.operationalState === "PAUSED" || !["APPROVED", "LIMITED"].includes(String(source.admissionState))) throw new AppError(400, "source_not_eligible", "Only active, approved sources may enter the URL frontier.");
    if (!Array.isArray(source.ingestionMethods) || !source.ingestionMethods.includes("WEB")) throw new AppError(400, "web_connector_not_approved", "This source is not approved for web acquisition.");
    if (source.domain && String(source.domain).toLowerCase() !== parsed.hostname.toLowerCase()) throw new AppError(400, "source_domain_mismatch", "A frontier URL must match its registered source domain.");
    const sourceAuthority = authoritySignal(source.authorityClass); const value = priority(input, sourceAuthority);
    const entry = await frontier.upsert({ where: { workspaceId_url: { workspaceId: input.workspaceId, url: parsed.toString() } }, create: { id: `NSI-FRONTIER-${crypto.randomUUID().replaceAll("-", "").slice(0,16).toUpperCase()}`, ...input, url: parsed.toString(), status: "QUEUED", sourceAuthority, priority: value, queuedBy: actor }, update: { sourceRegistryId: input.sourceRegistryId, topicRelevance: input.topicRelevance, freshness: input.freshness, changeProbability: input.changeProbability, crawlCost: input.crawlCost, userInterest: input.userInterest, sourceAuthority, priority: value, status: "QUEUED" } });
    await NuruAuditService.record({ operation: "DISCOVERY_CREATED", actor, resourceId: String((entry as Record<string, unknown>).id), inputReference: parsed.toString(), outputReference: String((entry as Record<string, unknown>).id), decision: "QUEUED", reason: "Operational URL-frontier priority; it is not a truth or evidence-quality score.", correlationId }); return entry;
  },
  async list(workspaceId: string) { return frontier.findMany({ where: { workspaceId }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }] }); },
};
