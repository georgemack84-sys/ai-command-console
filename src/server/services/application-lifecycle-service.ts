import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

const state = z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "MAINTENANCE", "DEPRECATED", "RETIRED"]);
export const applicationLifecycleTransitionSchema = z.object({ nextState: state, reason: z.string().trim().min(3).max(1_000) }).strict();
const transitions: Record<z.infer<typeof state>, readonly z.infer<typeof state>[]> = {
  DRAFT: ["ACTIVE", "RETIRED"],
  ACTIVE: ["MAINTENANCE", "SUSPENDED", "DEPRECATED"],
  MAINTENANCE: ["ACTIVE", "SUSPENDED", "DEPRECATED"],
  SUSPENDED: ["ACTIVE", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

export async function transitionApplicationLifecycle(workspaceId: string, applicationId: string, actorId: string, rawInput: unknown) {
  const input = applicationLifecycleTransitionSchema.parse(rawInput);
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  const current = application.lifecycleState;
  if (!transitions[current].includes(input.nextState)) throw new AppError(409, "application_lifecycle_transition_invalid", `${current} cannot transition to ${input.nextState}.`);
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.registeredApplication.update({ where: { id: applicationId }, data: { lifecycleState: input.nextState } });
    await transaction.activityEvent.create({ data: { workspaceId, userId: actorId, type: "application.lifecycle_transitioned", title: "Application lifecycle transitioned", description: `${application.displayName} transitioned from ${current} to ${input.nextState}: ${input.reason}`, metadata: { applicationId, previousState: current, nextState: input.nextState, protectedOperationsBlocked: String(["SUSPENDED", "RETIRED"].includes(input.nextState)) } } });
    return { applicationId: updated.id, previousState: current, lifecycleState: updated.lifecycleState, updatedAt: updated.updatedAt.toISOString(), protectedOperationsBlocked: ["SUSPENDED", "RETIRED"].includes(updated.lifecycleState) };
  });
}
