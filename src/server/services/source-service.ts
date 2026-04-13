import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { isProduction } from "@/src/config/env";
import { trackEvent } from "@/src/server/observability/analytics";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";

function isLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function assertValidSourceUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError(400, "invalid_source_url", "Source URL must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError(400, "invalid_source_url", "Source URL must use http or https.");
  }

  if (isProduction() && isLocalHost(parsed.hostname)) {
    throw new AppError(400, "invalid_source_url", "Localhost URLs are not allowed in production.");
  }
}

async function requireWorkspaceManager(input: {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
}) {
  if (input.userRole === "admin") {
    return;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: input.userId, workspaceId: input.workspaceId },
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new AppError(403, "source_forbidden", "Only workspace owners or admins can manage sources.");
  }
}

export async function createSource(input: {
  workspaceId: string;
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  name: string;
  type: "feed";
  url: string;
  updateCadence?: string;
  description?: string;
}) {
  await requireWorkspaceManager(input);
  const normalizedUrl = input.url.trim();
  assertValidSourceUrl(normalizedUrl);

  const existing = await prisma.source.findFirst({
    where: {
      workspaceId: input.workspaceId,
      url: normalizedUrl,
    },
  });

  if (existing) {
    throw new AppError(409, "source_exists", "A source with that URL already exists.");
  }

  const source = await prisma.source.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      type: input.type,
      status: "healthy",
      url: normalizedUrl,
      updateCadence: input.updateCadence?.trim() || "Hourly",
      description: input.description?.trim() || "RSS feed source.",
    },
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: "source.created",
      title: "Source created",
      description: `Created source ${source.name}.`,
      metadata: {
        sourceId: source.id,
        url: source.url,
        type: source.type,
      },
    },
  });

  trackEvent({
    event: "source_created",
    actorId: input.userId,
    workspaceId: input.workspaceId,
    properties: { sourceId: source.id, type: source.type },
  });

  return source;
}

export async function requestSourceRefresh(input: {
  workspaceId: string;
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  sourceId: string;
}) {
  const source = await prisma.source.findFirst({
    where: {
      id: input.sourceId,
      workspaceId: input.workspaceId,
    },
  });

  if (!source) {
    throw new AppError(404, "source_not_found", "Source not found.");
  }

  if (source.type !== "feed") {
    throw new AppError(400, "source_type_not_supported", "Only feed sources can be refreshed right now.");
  }

  const job = queueBackgroundJob(
    "source:refresh",
    {
      sourceId: source.id,
      workspaceId: source.workspaceId,
      requestedById: input.userId,
    },
    { actorId: input.userId, actorName: "source-refresh" },
    { maxAttempts: 3, retryDelayMs: 3_000, runtimeLimitMs: 30_000 },
  );

  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: "source.refresh.requested",
      title: "Source refresh requested",
      description: `Queued refresh for ${source.name}.`,
      metadata: {
        sourceId: source.id,
        jobId: job.id,
      },
    },
  });

  trackEvent({
    event: "source_refresh_requested",
    actorId: input.userId,
    workspaceId: input.workspaceId,
    properties: { sourceId: source.id, jobId: job.id },
  });

  return job;
}
