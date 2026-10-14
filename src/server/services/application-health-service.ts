import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

export async function getApplicationHealth(workspaceId: string, applicationId: string) {
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId }, include: { servicePrincipals: { include: { credentials: true } }, eventSubscriptions: { include: { deliveries: true } } } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  const credentials = application.servicePrincipals.flatMap((principal) => principal.credentials);
  const deliveries = application.eventSubscriptions.flatMap((subscription) => subscription.deliveries);
  const retrying = deliveries.filter((delivery) => delivery.status === "RETRYING").length;
  const deadLetter = deliveries.filter((delivery) => delivery.status === "DEAD_LETTER").length;
  const blocked = ["SUSPENDED", "RETIRED"].includes(application.lifecycleState);
  const status = blocked ? "ATTENTION" : deadLetter > 0 ? "DEGRADED" : retrying > 0 ? "WARNING" : "HEALTHY";
  return { applicationId, status, lifecycleState: application.lifecycleState, protectedOperationsBlocked: blocked, authorizationState: "SEPARATE_FROM_HEALTH", servicePrincipals: application.servicePrincipals.filter((principal) => principal.status === "ACTIVE").length, activeCredentials: credentials.filter((credential) => credential.status === "ACTIVE").length, subscriptions: application.eventSubscriptions.filter((subscription) => subscription.status === "ACTIVE").length, retryingDeliveries: retrying, deadLetterDeliveries: deadLetter, recommendedAction: blocked ? "Review lifecycle state before attempting protected operations." : deadLetter > 0 ? "Inspect dead-letter deliveries and repair the receiving integration before retrying." : retrying > 0 ? "Monitor retrying deliveries and confirm receiver recovery." : "No operational action is required." } as const;
}
