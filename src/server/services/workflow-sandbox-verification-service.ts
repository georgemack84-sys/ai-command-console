import { getAppUrl, getWorkflowDispatchReadiness } from "@/src/config/env";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

const HEALTH_CONTRACT = "proprium.workflow-sandbox";
const HEALTH_VERSION = "1";

type SandboxHealth = {
  contract: string;
  version: string;
  mode: string;
  publishesExternally: boolean;
  operations: string[];
};

function normalizedSandboxUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url.toString();
}

export function isBuiltInLocalSandbox(value: string) {
  const target = new URL(normalizedSandboxUrl(value));
  const application = getAppUrl();
  const allowedPath = "/api/sandbox/";
  if (!application) return false;
  return target.origin === application.origin && target.pathname === allowedPath;
}

function configuredSandbox() {
  const readiness = getWorkflowDispatchReadiness();
  if (readiness.mode !== "sandbox" || !readiness.sandboxUrl) {
    throw new AppError(409, "sandbox_not_configured", "Sandbox mode and a sandbox URL must be configured before verification.");
  }
  const sandboxUrl = normalizedSandboxUrl(readiness.sandboxUrl);
  if (!isBuiltInLocalSandbox(sandboxUrl)) {
    throw new AppError(409, "sandbox_not_local", "Only the built-in local, non-publishing sandbox can be verified in this environment.");
  }
  return sandboxUrl;
}

function validateHealth(payload: unknown): SandboxHealth {
  if (!payload || typeof payload !== "object") throw new AppError(502, "sandbox_health_invalid", "Sandbox health response was invalid.");
  const health = payload as Partial<SandboxHealth>;
  if (
    health.contract !== HEALTH_CONTRACT ||
    health.version !== HEALTH_VERSION ||
    health.mode !== "local-sandbox" ||
    health.publishesExternally !== false ||
    !Array.isArray(health.operations) ||
    !health.operations.includes("evidence.retrieve") ||
    !health.operations.includes("headline.draft")
  ) {
    throw new AppError(502, "sandbox_health_invalid", "Sandbox health response did not satisfy the non-publishing dispatch contract.");
  }
  return health as SandboxHealth;
}

export async function verifyWorkflowSandbox(input: { workspaceId: string; actorId: string }) {
  const sandboxUrl = configuredSandbox();
  const healthUrl = new URL("v1/workflow/health", sandboxUrl);
  let response: Response;
  try {
    response = await fetch(healthUrl, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
  } catch {
    throw new AppError(502, "sandbox_unreachable", "The configured local sandbox could not be reached for verification.");
  }
  if (!response.ok) throw new AppError(502, "sandbox_unhealthy", "The configured local sandbox did not pass its health check.");
  const envelope = await response.json() as { ok?: unknown; data?: unknown };
  if (envelope.ok !== true) throw new AppError(502, "sandbox_health_invalid", "Sandbox health response was not successful.");
  const health = validateHealth(envelope.data);
  const verificationProof = { health, healthUrl: healthUrl.toString(), verifiedMode: "local-only" };
  const record = await prisma.workflowSandboxVerification.upsert({
    where: { workspaceId_sandboxUrl: { workspaceId: input.workspaceId, sandboxUrl } },
    create: { workspaceId: input.workspaceId, sandboxUrl, verificationProof, verifiedById: input.actorId },
    update: { verificationProof, verifiedById: input.actorId, verifiedAt: new Date(), approvedById: null, approvedAt: null },
  });
  return { sandboxUrl, verifiedAt: record.verifiedAt, approvalRequired: true, health };
}

export async function approveWorkflowSandbox(input: { workspaceId: string; actorId: string }) {
  const sandboxUrl = configuredSandbox();
  const existing = await prisma.workflowSandboxVerification.findUnique({ where: { workspaceId_sandboxUrl: { workspaceId: input.workspaceId, sandboxUrl } } });
  if (!existing) throw new AppError(409, "sandbox_unverified", "Verify the local sandbox before owner approval.");
  const approved = await prisma.workflowSandboxVerification.update({
    where: { id: existing.id },
    data: { approvedById: input.actorId, approvedAt: new Date() },
  });
  return { sandboxUrl, verifiedAt: approved.verifiedAt, approvedAt: approved.approvedAt };
}

export async function getWorkflowSandboxDispatchSafety(workspaceId: string) {
  const base = getWorkflowDispatchReadiness();
  if (base.mode !== "sandbox" || !base.sandboxUrl) return base;
  const sandboxUrl = normalizedSandboxUrl(base.sandboxUrl);
  if (!isBuiltInLocalSandbox(sandboxUrl)) {
    return { ...base, sandboxUrl, dispatchEnabled: false, reason: "Only the built-in local sandbox is eligible for dispatch in this environment.", verification: "not_eligible" as const };
  }
  const verification = await prisma.workflowSandboxVerification.findUnique({ where: { workspaceId_sandboxUrl: { workspaceId, sandboxUrl } } });
  if (!verification) {
    return { ...base, sandboxUrl, dispatchEnabled: false, reason: "Verify the local sandbox before dispatch can be enabled.", verification: "required" as const };
  }
  if (!verification.approvedAt) {
    return { ...base, sandboxUrl, dispatchEnabled: false, reason: "A workspace owner must approve the verified local sandbox before dispatch can be enabled.", verification: "owner_approval_required" as const, verifiedAt: verification.verifiedAt };
  }
  return { ...base, sandboxUrl, dispatchEnabled: true, reason: "Built-in local sandbox is verified and owner-approved. It cannot publish externally.", verification: "approved" as const, verifiedAt: verification.verifiedAt, approvedAt: verification.approvedAt };
}
