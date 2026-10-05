import { z } from "zod";
import { sourceSchema } from "@/src/nuru/domain";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const sourceRegistrationSchema = sourceSchema;
export type NuruSource = z.infer<typeof sourceRegistrationSchema> & { sourceId: string; location: string };

function sourceId(source: z.infer<typeof sourceRegistrationSchema>) { return source.sourceId ?? source.id ?? `S-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`; }
function serialize(source: z.infer<typeof sourceRegistrationSchema>, id: string): NuruSource {
  return { ...source, id, sourceId: id, location: source.location ?? source.uri ?? source.origin };
}

/** Deterministic source registry. Agent output stays attributable derived evidence, never human authority. */
export const NuruSourceService = {
  async register(rawSource: z.input<typeof sourceRegistrationSchema>, actor: string, correlationId: string) {
    const source = sourceRegistrationSchema.parse(rawSource); const id = sourceId(source); const registered = serialize(source, id);
    const data = { id, sourceType: registered.sourceType, origin: registered.origin, uri: registered.uri, location: registered.location, author: registered.author, authority: registered.authority, checksum: registered.checksum, version: registered.version, derivedFromSourceId: registered.derivedFromSourceId, retrievedAt: registered.retrievedAt ? new Date(registered.retrievedAt) : new Date(), createdAt: registered.createdAt ? new Date(registered.createdAt) : new Date() };
    await nuruKnowledgeRepository.nuruSource.upsert({ where: { id }, create: data, update: { sourceType: data.sourceType, origin: data.origin, uri: data.uri, location: data.location, author: data.author, authority: data.authority, checksum: data.checksum, version: data.version, derivedFromSourceId: data.derivedFromSourceId, retrievedAt: data.retrievedAt } });
    await NuruAuditService.record({ operation: "SOURCE_REGISTERED", actor, resourceId: id, inputReference: registered.location.slice(0, 500), outputReference: id, decision: "REGISTERED", reason: registered.sourceType === "AGENT_OUTPUT" ? "Registered as derived agent evidence; it has no human-decision authority." : "Registered declared knowledge source.", correlationId });
    return registered;
  },

  async get(id: string): Promise<NuruSource | null> {
    const row = await nuruKnowledgeRepository.nuruSource.findUnique({ where: { id } }) as Record<string, unknown> | null;
    if (!row) return null;
    return serialize(sourceRegistrationSchema.parse({ ...row, sourceId: id, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt, retrievedAt: row.retrievedAt instanceof Date ? row.retrievedAt.toISOString() : row.retrievedAt }), id);
  },
};
