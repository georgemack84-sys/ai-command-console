import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { requestSourceRefresh } from "@/src/server/services/source-service";

const sourceRefreshActionSchema = z.object({
  sourceId: z.string().min(1),
});

type SourceRefreshActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeSourceRefreshAction(input: unknown, actor: SourceRefreshActor) {
  const body = sourceRefreshActionSchema.parse(input);
  await requireWorkspaceManager({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  const job = await requestSourceRefresh({
    workspaceId: actor.workspaceId,
    userId: actor.id,
    userRole: actor.role,
    sourceId: body.sourceId,
  });

  return { data: { job }, status: 202 };
}
