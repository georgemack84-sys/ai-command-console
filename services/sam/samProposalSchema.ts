import { z } from "zod";

import { SAM_ACTION_TYPES } from "./samConstants";
import { SAM_ERROR_CODES, createSamError } from "./samErrors";
import type { SamActionType, SamProposal, SamProposalValidationResult } from "./samTypes";

const ACTION_SET = new Set<string>(SAM_ACTION_TYPES);
const TenantContextSchema = z.object({
  tenantId: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1),
  operatorId: z.string().trim().min(1).optional(),
  source: z.enum(["session", "apiKey", "test", "system"]),
  isolationVersion: z.literal("3.6G"),
}).strict();

export function normalizeSamActionType(value: unknown): SamActionType {
  const normalized = String(value || "").trim();
  return ACTION_SET.has(normalized) ? (normalized as SamActionType) : "unknown";
}

const ProposalSchema = z.object({
  proposalId: z.string().trim().min(1),
  executionId: z.string().trim().min(1),
  attemptId: z.string().trim().min(1),
  actionType: z.string().transform((value) => normalizeSamActionType(value)),
  requestedBy: z.enum(["ai", "operator", "system"]),
  reason: z.string().trim().min(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  params: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().trim().min(1),
  tenantContext: TenantContextSchema.optional(),
});

export function validateSamProposal(input: unknown): SamProposalValidationResult {
  const parsed = ProposalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        createSamError(
          SAM_ERROR_CODES.SAM_PROPOSAL_INVALID,
          parsed.error.issues[0]?.message || "Invalid S.A.M. proposal.",
          "proposal",
          false,
        ),
      ],
    };
  }

  const proposal = parsed.data as SamProposal;
  if (proposal.actionType === "unknown") {
    return {
      ok: false,
      errors: [
        createSamError(
          SAM_ERROR_CODES.SAM_PROPOSAL_INVALID,
          "Unknown S.A.M. action type.",
          "proposal",
          false,
        ),
      ],
    };
  }

  return {
    ok: true,
    data: proposal,
    errors: [],
  };
}
