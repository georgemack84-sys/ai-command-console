import { z } from "zod";

export const priorityInputSchema = z.object({ artifactType: z.string().min(1), novelty: z.enum(["LOW", "MODERATE", "HIGH"]).default("MODERATE"), projectRelevant: z.boolean().default(false), sourceAuthority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]), conflictDetected: z.boolean().default(false), relationshipCount: z.number().int().min(0).max(100).default(0), duplicateLikely: z.boolean().default(false), ageDays: z.number().min(0).default(0), humanPriority: z.number().int().min(-25).max(25).default(0) });
export type PriorityInput = z.infer<typeof priorityInputSchema>;
export type PriorityScore = { score: number; factors: Array<{ label: string; points: number }> };

/** Queue ordering only: deterministic, explainable, and independent of Curator authority. */
export const NuruPriorityService = {
  score(rawInput: PriorityInput): PriorityScore {
    const input = priorityInputSchema.parse(rawInput); const factors: PriorityScore["factors"] = [];
    if (/architecture decision/i.test(input.artifactType)) factors.push({ label: "Architecture decision", points: 30 });
    if (input.novelty === "HIGH") factors.push({ label: "High novelty", points: 10 }); else if (input.novelty === "LOW") factors.push({ label: "Low novelty", points: -5 });
    if (input.projectRelevant) factors.push({ label: "Related to active work", points: 15 });
    if (input.sourceAuthority === "OWNER") factors.push({ label: "Owner directive", points: 25 }); else if (input.sourceAuthority === "HIGH") factors.push({ label: "High-authority source", points: 10 }); else if (input.sourceAuthority === "LOW") factors.push({ label: "Low-authority source", points: -15 });
    if (input.conflictDetected) factors.push({ label: "Contradiction detected", points: 20 });
    if (input.relationshipCount >= 3) factors.push({ label: "Multiple relationships", points: 10 });
    if (input.duplicateLikely) factors.push({ label: "Duplicate likely", points: -10 });
    if (input.ageDays > 365) factors.push({ label: "Older material", points: -5 }); else if (input.ageDays < 30) factors.push({ label: "Recent material", points: 5 });
    if (input.humanPriority) factors.push({ label: "Human priority", points: input.humanPriority });
    return { score: Math.max(0, Math.min(100, 50 + factors.reduce((total, factor) => total + factor.points, 0))), factors };
  },
};
