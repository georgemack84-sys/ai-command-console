export type BillUpdatedEvent = {
  eventId: string;
  eventType: "proprium.bill.updated.v1";
  eventVersion: 1;
  occurredAtUtc: string;
  correlationId: string;
  causationId: string | null;
  actorId: string | null;
  scope: { householdId: string; userId: string | null; entityId: string | null };
  data: { billId: string; amount: number; dueDate: string };
};

export type PropriumEvent = BillUpdatedEvent | (Omit<BillUpdatedEvent, "eventType" | "data"> & { eventType: "proprium.bill.created.v1" | "proprium.bill.paid.v1" | "proprium.bill.unpaid.v1"; data: { billId: string } });

export type RealtimeConnectionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DEGRADED";

export function isPropriumEvent(value: unknown): value is PropriumEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<PropriumEvent>;
  return (event.eventType === "proprium.bill.updated.v1" || event.eventType === "proprium.bill.created.v1" || event.eventType === "proprium.bill.paid.v1" || event.eventType === "proprium.bill.unpaid.v1") && event.eventVersion === 1 && typeof event.eventId === "string" && typeof event.correlationId === "string";
}
