import { z } from "zod";

export const semanticGovernanceSchema = z.object({
  valid: z.boolean(),
  semanticValid: z.boolean(),
  governanceApproved: z.boolean(),
  plannerAdmissible: z.boolean(),
  ambiguityDetected: z.boolean(),
  escalationRequired: z.boolean(),
  clarificationRequired: z.boolean(),
  protectedTargetDetected: z.boolean(),
  replayDriftDetected: z.boolean(),
  freezeActive: z.boolean(),
  riskLevel: z.enum(["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "PROHIBITED"]),
  violations: z.array(z.string()),
  warnings: z.array(z.string()),
  semanticConflicts: z.array(z.string()),
  governanceReasons: z.array(z.string()),
  plannerBlockReasons: z.array(z.string()),
  nextState: z.enum(["ALLOW_PLANNING", "REQUIRE_APPROVAL", "REQUEST_CLARIFICATION", "ESCALATE", "BLOCK", "FREEZE"]),
  auditId: z.string().min(1),
});
