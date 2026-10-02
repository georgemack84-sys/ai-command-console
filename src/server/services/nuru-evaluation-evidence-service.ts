import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const evaluationEvidenceSchema = z.object({
  status: z.literal("PASSED"),
  verifiedAt: z.string().datetime(),
  command: z.string().min(1),
  testFiles: z.number().int().positive(),
  tests: z.number().int().positive(),
});

export type NuruEvaluationEvidence = z.infer<typeof evaluationEvidenceSchema>;

const evidencePath = path.join(process.cwd(), "data", "nuru", "evaluation-evidence.json");

/**
 * A deterministic release-evidence reader. Agents never write this artifact;
 * only the local verification runner records it after a successful suite.
 */
export const NuruEvaluationEvidenceService = {
  async latest(): Promise<NuruEvaluationEvidence | null> {
    try {
      return evaluationEvidenceSchema.parse(JSON.parse(await readFile(evidencePath, "utf8")));
    } catch {
      return null;
    }
  },
};
