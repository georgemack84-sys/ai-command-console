import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { updateBrief, updateReport } from "@/src/server/services/research-service";
import type { SessionUser } from "@/src/lib/types";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("ownership:claim-item"),
    payload: z.object({ resourceType: z.enum(["brief", "report"]), resourceId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("ownership:release-item"),
    payload: z.object({ resourceType: z.enum(["brief", "report"]), resourceId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("ownership:assign-item"),
    payload: z.object({
      resourceType: z.enum(["brief", "report"]),
      resourceId: z.string().min(1),
      ownerId: z.string().min(1).nullable(),
    }),
  }),
]);

type OwnershipActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;
type ResourceType = "brief" | "report";
type OwnedResource = { id: string; title: string; ownerId: string | null };

async function loadResource(resourceType: ResourceType, resourceId: string, workspaceId: string): Promise<OwnedResource> {
  const resource = resourceType === "brief"
    ? await prisma.researchBrief.findFirst({ where: { id: resourceId, workspaceId }, select: { id: true, title: true, ownerId: true } })
    : await prisma.researchReport.findFirst({ where: { id: resourceId, workspaceId }, select: { id: true, title: true, ownerId: true } });
  if (!resource) {
    throw new AppError(404, `${resourceType}_not_found`, `${resourceType === "brief" ? "Brief" : "Report"} not found.`);
  }
  return resource;
}

async function resolveWorkspaceOwner(workspaceId: string, ownerId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: ownerId, user: { status: "active" } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!membership) {
    throw new AppError(400, "invalid_assignment_target", "The selected owner is not an active member of this workspace.");
  }
  return membership.user;
}

async function persistOwner(resourceType: ResourceType, resourceId: string, ownerId: string | null, actor: OwnershipActor) {
  const input = {
    workspaceId: actor.workspaceId,
    actorId: actor.id,
    actorRole: actor.role,
    patch: { ownerId },
  };
  if (resourceType === "brief") {
    return updateBrief({ ...input, briefId: resourceId });
  }
  return updateReport({ ...input, reportId: resourceId });
}

async function recordAssignmentActivity(input: {
  actor: OwnershipActor;
  action: string;
  resource: OwnedResource;
  resourceType: ResourceType;
  previousOwnerId: string | null;
  owner: { id: string; name: string; email: string } | null;
}) {
  const actorName = input.actor.name || input.actor.email;
  const ownerName = input.owner?.name || input.owner?.email || "Unassigned";
  await prisma.activityEvent.create({
    data: {
      workspaceId: input.actor.workspaceId,
      userId: input.actor.id,
      type: input.action,
      title: "Work ownership updated",
      description: `${actorName} set ${input.resourceType} "${input.resource.title}" owner to ${ownerName}.`,
      metadata: {
        resourceType: input.resourceType,
        resourceId: input.resource.id,
        previousOwnerId: input.previousOwnerId,
        ownerId: input.owner?.id || null,
        ownerName,
      },
    },
  });
}

export async function executeTerminalOwnershipAction(input: unknown, actor: OwnershipActor) {
  const parsed = actionSchema.parse(input);
  if (actor.role === "viewer") {
    throw new AppError(403, "ownership_forbidden", "Viewer accounts cannot change work ownership.");
  }

  const resource = await loadResource(parsed.payload.resourceType, parsed.payload.resourceId, actor.workspaceId);
  let ownerId: string | null;

  if (parsed.action === "ownership:claim-item") {
    if (resource.ownerId && resource.ownerId !== actor.id) {
      throw new AppError(403, "ownership_forbidden", "Only an unowned item can be claimed. Ask an admin to reassign owned work.");
    }
    ownerId = actor.id;
  } else if (parsed.action === "ownership:release-item") {
    if (resource.ownerId !== actor.id && actor.role !== "admin") {
      throw new AppError(403, "ownership_forbidden", "Only the current owner or an admin can release this item.");
    }
    ownerId = null;
  } else {
    if (actor.role !== "admin") {
      throw new AppError(403, "ownership_forbidden", "Only an admin can assign work to another workspace member.");
    }
    ownerId = parsed.payload.ownerId;
  }

  const owner = ownerId ? await resolveWorkspaceOwner(actor.workspaceId, ownerId) : null;
  await persistOwner(parsed.payload.resourceType, resource.id, ownerId, actor);
  await recordAssignmentActivity({
    actor,
    action: parsed.action,
    resource,
    resourceType: parsed.payload.resourceType,
    previousOwnerId: resource.ownerId,
    owner,
  });

  return {
    action: parsed.action,
    output: owner
      ? `${parsed.payload.resourceType === "brief" ? "Brief" : "Report"} "${resource.title}" is now owned by ${owner.name || owner.email}.`
      : `Released ownership of ${parsed.payload.resourceType} "${resource.title}".`,
  };
}
