import { z } from "zod";

export const plannerAdmissionDecisionSchema = z.object({
  admissible: z.boolean(),
  denied: z.boolean(),
  reasons: z.array(z.string()),
  escalationRequired: z.boolean(),
  governanceState: z.string().min(1),
});
