import { tandemKnowledgeSubscriptionDeliverySchema, tandemKnowledgeSubscriptionSchema, tandemKnowledgeUpdateSchema, type TandemKnowledgeSubscription } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;
export type SubscriptionRecord = TandemKnowledgeSubscription & { workspaceId: string; createdAt: Date };
export type NuruTandemSubscriptionStore = { create(subscription: SubscriptionRecord): Promise<SubscriptionRecord>; list(workspaceId: string): Promise<SubscriptionRecord[]>; createDelivery(delivery: { id: string; subscriptionId: string; missionId: string; updateId: string; deliveredAt: Date }): Promise<unknown> };
const persistence = nuruKnowledgeRepository as unknown as { tandemKnowledgeSubscription: { create(args: unknown): Promise<SubscriptionRecord>; findMany(args: unknown): Promise<SubscriptionRecord[]> }; tandemKnowledgeSubscriptionDelivery: { create(args: unknown): Promise<unknown> } };
const defaultStore: NuruTandemSubscriptionStore = { create: (subscription) => persistence.tandemKnowledgeSubscription.create({ data: subscription }), list: (workspaceId) => persistence.tandemKnowledgeSubscription.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" }, take: 500 }), createDelivery: (delivery) => persistence.tandemKnowledgeSubscriptionDelivery.create({ data: delivery }) };

/** Pure matching plus append-only delivery receipts. A delivery signals a mission; it never edits its context. */
export class NuruTandemKnowledgeSubscriptionService {
  constructor(private readonly store: NuruTandemSubscriptionStore = defaultStore) {}
  async subscribe(raw: TandemKnowledgeSubscription, workspaceId: string) { const subscription = tandemKnowledgeSubscriptionSchema.parse(raw); return this.store.create({ ...subscription, workspaceId, createdAt: new Date() }); }
  async list(workspaceId: string) { return this.store.list(workspaceId); }
  async publish(raw: unknown, workspaceId: string) {
    const update = tandemKnowledgeUpdateSchema.parse(raw); const subscriptions = await this.store.list(workspaceId);
    const matching = subscriptions.filter((subscription) => rank[update.significance] >= rank[subscription.significanceThreshold] && subscription.eventTypes.includes(update.eventType) && (subscription.entityIds.some((id) => update.entityIds.includes(id)) || subscription.topics.some((topic) => update.topics.includes(topic))));
    const deliveredAt = new Date();
    await Promise.all(matching.map((subscription) => this.store.createDelivery({ id: `TANDEM-NURU-DELIVERY-${crypto.randomUUID()}`, subscriptionId: subscription.subscriptionId, missionId: subscription.missionId, updateId: update.updateId, deliveredAt })));
    return matching.map((subscription) => tandemKnowledgeSubscriptionDeliverySchema.parse({ deliveryId: `pending:${subscription.subscriptionId}:${update.updateId}`, subscriptionId: subscription.subscriptionId, missionId: subscription.missionId, updateId: update.updateId, deliveredAt: deliveredAt.toISOString(), contextMutation: "NONE" }));
  }
}
export const nuruTandemKnowledgeSubscriptionService = new NuruTandemKnowledgeSubscriptionService();
