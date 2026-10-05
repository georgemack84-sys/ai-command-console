import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

const architectureDecisionSchema = z.object({
  project: z.string().trim().min(1).max(120),
  phase: z.literal("V1"),
  topic: z.string().trim().min(1).max(160),
  scope: z.string().trim().min(1).max(160),
  artifactType: z.literal("Architecture Decision"),
  confidence: z.number().min(0).max(1),
}).strict();

const knowledgeNoteSchema = z.object({
  project: z.string().trim().min(1).max(120).optional(),
  topic: z.string().trim().min(1).max(160),
  scope: z.string().trim().min(1).max(160),
  artifactType: z.literal("Knowledge Note"),
  confidence: z.number().min(0).max(1),
}).strict();

const schemas = { "Architecture Decision": architectureDecisionSchema, "Knowledge Note": knowledgeNoteSchema } as const;
export type NuruMetadataType = keyof typeof schemas;
export type NuruMetadata = z.infer<typeof architectureDecisionSchema> | z.infer<typeof knowledgeNoteSchema>;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
}

export function getMetadataSchema(type: NuruMetadataType) {
  return schemas[type];
}

export function normalizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, normalizeString(value)]));
}

export function validateMetadata(type: NuruMetadataType, metadata: Record<string, unknown>) {
  return schemas[type].safeParse(normalizeMetadata(metadata));
}

/** The only mutation API for normalized Nuru metadata. */
export async function updateMetadata(itemId: string, type: NuruMetadataType, patch: Record<string, unknown>) {
  const validated = validateMetadata(type, patch);
  if (!validated.success) return validated;
  const entries = Object.entries(validated.data);
  await nuruKnowledgeRepository.$transaction(async (tx) => {
    await Promise.all(entries.map(([key, value]) => tx.nuruMetadataRecord.upsert({
      where: { itemId_key: { itemId, key } },
      create: { itemId, key, value },
      update: { value },
    })));
    await tx.nuruKnowledgeItem.update({ where: { id: itemId }, data: { metadata: validated.data } });
  });
  return validated;
}

export async function getMetadata(itemId: string) {
  const records = await nuruKnowledgeRepository.nuruMetadataRecord.findMany({ where: { itemId }, orderBy: { key: "asc" } });
  return Object.fromEntries(records.map((record) => [record.key, record.value]));
}
