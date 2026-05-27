import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { runSamBridge } from "@/services/sam/samBridgeController";
import { ensureDefaultContractsRegistered } from "@/services/contracts/registerDefaultContracts";
import { getRegisteredContract } from "@/services/contracts/contractRegistry";
import { validateContractPayload } from "@/services/contracts/validateContract";
import { recordApiMetric } from "@/services/contracts/apiMetrics";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { getPermissionForSamAction } from "@/services/security/actionPermissions";
import type { SamActionType } from "@/services/sam/samTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeSamActionType(value: unknown): SamActionType {
  const normalized = String(value || "unknown");
  switch (normalized) {
    case "recover_execution":
    case "pause_execution":
    case "resume_execution":
    case "cancel_execution":
    case "export_evidence":
    case "add_operator_note":
    case "inspect_state":
      return normalized;
    default:
      return "unknown";
  }
}

const responseSchema = z.object({
  result: z.object({
    ok: z.boolean(),
    mode: z.literal("bridge"),
    proposalId: z.string(),
    executionId: z.string(),
    stage: z.enum(["proposal", "preflight", "approval", "dry_run", "audit", "blocked", "completed"]),
    blocked: z.boolean(),
  }).passthrough(),
  contractVersion: z.literal("v1"),
  contractHash: z.string(),
}).strict();

export async function POST(request: Request) {
  try {
    ensureDefaultContractsRegistered();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const securityContext = createSecurityContextFromSessionUser({ user, tenantContext });

    const contract = getRegisteredContract("api.v1.sam.proposal.request", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "S.A.M. proposal contract is missing.");
    }

    const parsed = validateContractPayload<{
      proposal: Record<string, unknown>;
      approval?: {
        status: "required" | "granted" | "denied" | "not_applicable";
        approvedBy?: string;
        reason?: string;
      };
    }>({
      schema: contract.schema,
      payload: await request.json(),
      tenantScope: {
        required: true,
        tenantContext,
      },
    });
    if (!parsed.ok) {
      recordApiMetric("sam.proposal.validation_failed", 1, tenantContext);
      throw new AppError(400, parsed.error.code, parsed.error.message, parsed.error.details);
    }

    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: getPermissionForSamAction(normalizeSamActionType(parsed.data.proposal.actionType)),
      action: "sam.proposal",
      resource: { executionId: parsed.data.proposal.executionId, proposalId: parsed.data.proposal.proposalId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const result = await runSamBridge({
      ...parsed.data,
      proposal: {
        ...parsed.data.proposal,
        tenantContext,
      },
    });
    const responsePayload = {
      result,
      contractVersion: "v1" as const,
      contractHash: contract.hash,
    };

    const validatedResponse = validateContractPayload<typeof responsePayload>({
      schema: responseSchema,
      payload: responsePayload,
      tenantScope: {
        required: true,
        tenantContext,
      },
    });
    if (!validatedResponse.ok) {
      recordApiMetric("sam.proposal.outbound_validation_failed", 1, tenantContext);
      throw new AppError(500, validatedResponse.error.code, validatedResponse.error.message, validatedResponse.error.details);
    }

    recordApiMetric("sam.proposal.success", 1, tenantContext);
    return apiSuccess(validatedResponse.data, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to process S.A.M. proposal.");
  }
}
