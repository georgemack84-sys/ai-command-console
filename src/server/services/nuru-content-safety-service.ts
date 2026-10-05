import { z } from "zod";
export const nuruExternalContentSchema = z.object({ content: z.string().max(100_000), sourceType: z.string().min(1) });
const instructionLike = /\b(ignore|disregard|override|bypass|delete|archive)\b.{0,80}\b(instruction|policy|system|governance|archive|record)\b/i;
/** Treats supplied content as untrusted data. It cannot grant permissions or invoke tools. */
export const NuruContentSafetyService = { inspect(raw: z.input<typeof nuruExternalContentSchema>) { const input = nuruExternalContentSchema.parse(raw); const injection = instructionLike.test(input.content); return { content: input.content, classification: injection ? "UNTRUSTED_DATA_REQUIRES_REVIEW" as const : "UNTRUSTED_DATA" as const, executable: false, toolAuthority: false, warnings: injection ? ["Instruction-like external content was retained as data and routed for review."] : [] }; } };
