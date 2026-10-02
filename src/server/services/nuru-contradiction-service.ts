import { z } from "zod";
import { nuruKnowledgeRepository, type NuruArchiveModel } from "@/src/server/repositories/nuru-knowledge-repository";

export const contradictionStates = ["NONE", "POTENTIAL_CONTRADICTION", "SCOPED_DIFFERENCE", "OUTDATED_CANDIDATE", "EXCEPTION_CANDIDATE"] as const;
export const contradictionInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), limit: z.number().int().min(1).max(50).default(20) });
export const contradictionFindingSchema = z.object({ itemId: z.string(), relatedItemId: z.string(), state: z.enum(contradictionStates), confidence: z.number().min(0).max(1), evidence: z.array(z.string()), investigation: z.array(z.string()) });
export type ContradictionFinding = z.infer<typeof contradictionFindingSchema>;
const archiveRepository = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;

function directDatabaseClaim(content: string) { const statement = content.toLowerCase(); return /agents?/.test(statement) && /\b(may|can|should)\b/.test(statement) && /\b(write|access)\b/.test(statement) && /\b(database|db)\b/.test(statement) && /\bdirect/.test(statement); }
function serviceBoundaryClaim(content: string) { return /agents?[^.]{0,100}(must|only|cannot|may not)[^.]{0,100}(service|services|persistence)/i.test(content) && /(database|persist|storage|service)/i.test(content); }

/** Finds competing claims and records questions for review; it never resolves, mutates, or supersedes knowledge. */
export const NuruContradictionService = {
  async assess(rawInput: z.input<typeof contradictionInputSchema>): Promise<ContradictionFinding[]> {
    const input = contradictionInputSchema.parse(rawInput);
    const candidates = await archiveRepository.findMany({ where: { ...(input.project ? { project: input.project } : {}) }, take: input.limit, orderBy: { createdAt: "desc" } });
    const incomingDirect = directDatabaseClaim(input.content); const incomingBoundary = serviceBoundaryClaim(input.content);
    const findings = candidates.filter((candidate) => candidate.id !== input.itemId).flatMap((candidate) => {
      const opposing = (incomingDirect && serviceBoundaryClaim(candidate.content)) || (incomingBoundary && directDatabaseClaim(candidate.content));
      if (!opposing) return [];
      return [contradictionFindingSchema.parse({ itemId: input.itemId, relatedItemId: candidate.id, state: "POTENTIAL_CONTRADICTION", confidence: 0.9, evidence: ["One statement permits direct agent database access while the other requires a service boundary.", `Candidate: ${candidate.title}`], investigation: ["Did the architecture change?", "Are the statements scoped differently?", "Is either item outdated?", "Should a reviewed successor supersede an earlier item?", "Is one statement an explicit exception?"] })];
    });
    await Promise.all(findings.map((finding) => nuruKnowledgeRepository.nuruContradictionAssessment.create({ data: finding })));
    return findings;
  },
};
