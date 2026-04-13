import { prisma } from "@/src/server/db/prisma";
import { featureFlagsEnabled } from "@/src/config/env";

const DEFAULT_FLAGS: Record<string, boolean> = {
  alerts_v2: true,
  connector_registry: true,
  intelligence_scoring: true,
  agent_jobs: false,
};

export async function listFeatureFlags() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });
  return flags;
}

export async function updateFeatureFlag(key: string, enabled: boolean) {
  return prisma.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });
}

export async function setWorkspaceFeatureFlag(input: {
  workspaceId: string;
  key: string;
  enabled: boolean;
}) {
  const flag = await prisma.featureFlag.findUnique({ where: { key: input.key } });
  if (!flag) {
    return prisma.featureFlag.create({
      data: { key: input.key, enabled: input.enabled },
    });
  }

  return prisma.workspaceFeatureFlag.upsert({
    where: {
      workspaceId_flagId: {
        workspaceId: input.workspaceId,
        flagId: flag.id,
      },
    },
    update: { enabled: input.enabled },
    create: {
      workspaceId: input.workspaceId,
      flagId: flag.id,
      enabled: input.enabled,
    },
  });
}

export async function ensureDefaultFeatureFlags() {
  if (!featureFlagsEnabled()) {
    return [];
  }

  const existing = await prisma.featureFlag.findMany({
    where: { key: { in: Object.keys(DEFAULT_FLAGS) } },
  });
  const existingKeys = new Set(existing.map((flag) => flag.key));

  const missing = Object.entries(DEFAULT_FLAGS).filter(([key]) => !existingKeys.has(key));
  if (!missing.length) {
    return existing;
  }

  await prisma.featureFlag.createMany({
    data: missing.map(([key, enabled]) => ({
      key,
      enabled,
    })),
    skipDuplicates: true,
  });

  return prisma.featureFlag.findMany({
    where: { key: { in: Object.keys(DEFAULT_FLAGS) } },
  });
}

export async function isFeatureEnabled(flagKey: string, workspaceId?: string | null) {
  if (!featureFlagsEnabled()) {
    return false;
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) {
    return DEFAULT_FLAGS[flagKey] ?? false;
  }

  if (!workspaceId) {
    return flag.enabled;
  }

  const override = await prisma.workspaceFeatureFlag.findFirst({
    where: {
      workspaceId,
      flagId: flag.id,
    },
  });

  return override ? override.enabled : flag.enabled;
}

export function getDefaultFlagState(flagKey: string) {
  return DEFAULT_FLAGS[flagKey] ?? false;
}
