import { createHash } from "node:crypto";
import { z } from "zod";

const workflowSlug = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{1,62}$/, "Use lowercase letters, numbers, and hyphens.");
const contractVersion = z.string().regex(/^\d+\.\d+$/, "Contract versions must use major.minor format.");
const jsonValue: z.ZodType<JsonValue> = z.lazy(() => z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]));

type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export const workflowIdentitySchema = z.object({
  slug: workflowSlug,
  displayName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1_000),
}).strict();

// Phase 6.0 deliberately treats the definition body as an opaque JSON snapshot.
// Phase 6.1 replaces it with the typed graph contract and its semantic checks.
export const workflowPublicationSchema = z.object({
  contractVersion,
  definition: jsonValue,
}).strict();

export type WorkflowIdentity = Readonly<z.infer<typeof workflowIdentitySchema>>;
export type WorkflowPublication = Readonly<z.infer<typeof workflowPublicationSchema>>;

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const record = value as { readonly [key: string]: JsonValue };
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalize(record[key]!)]));
  }
  return value;
}

export function immutableWorkflowSnapshot(raw: unknown) {
  const publication = workflowPublicationSchema.parse(raw);
  const definitionSnapshot = canonicalize(publication.definition);
  const serialized = JSON.stringify({ contractVersion: publication.contractVersion, definition: definitionSnapshot });
  return {
    contractVersion: publication.contractVersion,
    definitionSnapshot,
    definitionHash: createHash("sha256").update(serialized).digest("hex"),
  } as const;
}

export function workflowRunSnapshot(input: { versionId: string; contractVersion: string; definitionSnapshot: unknown; definitionHash: string }) {
  const source = z.object({
    versionId: z.string().min(1), contractVersion, definitionSnapshot: jsonValue,
    definitionHash: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict().parse(input);
  const snapshot = immutableWorkflowSnapshot({ contractVersion: source.contractVersion, definition: source.definitionSnapshot });
  if (snapshot.definitionHash !== source.definitionHash) throw new Error("Workflow version snapshot hash mismatch.");
  return Object.freeze({ workflowVersionId: source.versionId, ...snapshot });
}
