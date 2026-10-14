import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

const subscriptionSchema = z.object({ eventType: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/), version: z.string().regex(/^\d+\.\d+$/) }).strict();
const MAX_DELIVERY_ATTEMPTS = 3;

export async function subscribeApplicationEvents(workspaceId: string, applicationId: string, actorId: string, raw: unknown) {
  const input = subscriptionSchema.parse(raw);
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  if (["SUSPENDED", "RETIRED"].includes(application.lifecycleState)) throw new AppError(409, "application_not_event_eligible", "Suspended or retired applications cannot subscribe to events.");
  try { return await prisma.applicationEventSubscription.create({ data: { applicationId, ...input, createdById: actorId } }); } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "P2002") throw new AppError(409, "event_subscription_conflict", "This event version is already subscribed."); throw error; }
}

export async function recordEventDelivery(subscriptionId: string, eventId: string, error?: string) {
  const subscription = await prisma.applicationEventSubscription.findUnique({ where: { id: subscriptionId }, include: { application: true } });
  if (!subscription || subscription.status !== "ACTIVE" || ["SUSPENDED", "RETIRED"].includes(subscription.application.lifecycleState)) return null;
  const existing = await prisma.applicationEventDelivery.findUnique({ where: { subscriptionId_eventId: { subscriptionId, eventId } } });
  if (existing?.status === "DEAD_LETTER") return existing;
  const attempts = (existing?.attempts ?? 0) + 1;
  const status = error ? (attempts >= MAX_DELIVERY_ATTEMPTS ? "DEAD_LETTER" : "RETRYING") : "DELIVERED";
  return prisma.applicationEventDelivery.upsert({ where: { subscriptionId_eventId: { subscriptionId, eventId } }, create: { subscriptionId, eventId, status, attempts, lastError: error }, update: { status, attempts, lastError: error ?? null } });
}

export async function listEventDeliveryDiagnostics(workspaceId: string, applicationId: string) {
  const application = await prisma.registeredApplication.findFirst({ where: { id: applicationId, workspaceId } });
  if (!application) throw new AppError(404, "application_not_found", "Application was not found in this workspace.");
  return prisma.applicationEventDelivery.findMany({ where: { subscription: { applicationId } }, select: { id: true, eventId: true, status: true, attempts: true, lastError: true, updatedAt: true, subscription: { select: { eventType: true, version: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
}
