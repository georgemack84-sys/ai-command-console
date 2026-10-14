import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

const version = z.string().regex(/^\d+\.\d+$/, "Capability versions must use major.minor format.");
const stringList = z.array(z.string().trim().min(1).max(160)).max(20).default([]).transform((items) => [...new Set(items)]);

export const capabilityDeclarationSchema = z.object({
  capabilityKey: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*)+$/, "Use a dot-separated capability key."),
  version,
  description: z.string().trim().min(2).max(1_000),
  inputSchema: z.record(z.string().min(1).max(80), z.unknown()).refine((value) => Object.keys(value).length <= 50, "Input schema is too large."),
  requiredPermissions: stringList,
  constraints: stringList,
}).strict();

export type ApplicationCapabilityView = Readonly<{
  capabilityId: string;
  applicationId: string;
  capabilityKey: string;
  version: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredPermissions: readonly string[];
  constraints: readonly string[];
  declaredAt: string;
  executionAuthorized: false;
}>;

function view(value: { id: string; applicationId: string; capabilityKey: string; version: string; description: string; inputSchema: unknown; requiredPermissions: string[]; constraints: string[]; declaredAt: Date }): ApplicationCapabilityView {
  const inputSchema = value.inputSchema && typeof value.inputSchema === "object" && !Array.isArray(value.inputSchema) ? value.inputSchema as Record<string, unknown> : {};
  return { capabilityId: value.id, applicationId: value.applicationId, capabilityKey: value.capabilityKey, version: value.version, description: value.description, inputSchema, requiredPermissions: value.requiredPermissions, constraints: value.constraints, declaredAt: value.declaredAt.toISOString(), executionAuthorized: false };
}

async function applicationForWorkspace(workspaceId: string, applicationId: string) {
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  if (["SUSPENDED", "RETIRED"].includes(application.lifecycleState)) throw new AppError(409, "application_not_capability_eligible", "Suspended or retired applications cannot declare capabilities.");
}

export async function declareApplicationCapability(workspaceId: string, applicationId: string, actorId: string, rawInput: unknown) {
  const input = capabilityDeclarationSchema.parse(rawInput);
  await applicationForWorkspace(workspaceId, applicationId);
  try {
    return await prisma.$transaction(async (transaction) => {
      const capability = await transaction.applicationCapability.create({ data: { applicationId, ...input, inputSchema: input.inputSchema as Prisma.InputJsonValue, declaredById: actorId } });
      await transaction.activityEvent.create({ data: { workspaceId, userId: actorId, type: "application.capability_declared", title: "Application capability declared", description: `${input.capabilityKey}@${input.version} was declared. Declaration does not authorize invocation.`, metadata: { applicationId, capabilityId: capability.id, capabilityKey: input.capabilityKey, version: input.version, executionAuthorized: "false" } } });
      return view(capability);
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") throw new AppError(409, "capability_version_conflict", "This capability version is already declared for the application.");
    throw error;
  }
}

export async function discoverApplicationCapabilities(workspaceId: string, applicationId: string) {
  await applicationForWorkspace(workspaceId, applicationId);
  return (await prisma.applicationCapability.findMany({ where: { applicationId }, orderBy: [{ capabilityKey: "asc" }, { version: "asc" }] })).map(view);
}
