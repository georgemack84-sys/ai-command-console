import { describe, expect, it } from "vitest";
import { PropriumRealtimeClient, type EventSourceConnection } from "../lib/realtime/proprium-realtime-client";

class FakeEventSource implements EventSourceConnection {
  public onopen: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  private readonly listeners = new Map<string, Set<(event: Event) => void>>();
  public close(): void {}
  public addEventListener(type: string, listener: (event: Event) => void): void { (this.listeners.get(type) ?? this.add(type)).add(listener); }
  public removeEventListener(type: string, listener: (event: Event) => void): void { this.listeners.get(type)?.delete(listener); }
  public emit(type: string, data: unknown): void { for (const listener of this.listeners.get(type) ?? []) listener({ data: JSON.stringify(data) } as MessageEvent<string>); }
  private add(type: string): Set<(event: Event) => void> { const listeners = new Set<(event: Event) => void>(); this.listeners.set(type, listeners); return listeners; }
}

describe("PropriumRealtimeClient", () => {
  it("delivers known versioned events and ignores unknown contracts", () => {
    const source = new FakeEventSource();
    const client = new PropriumRealtimeClient({ endpoint: "https://proprium.test/api/v1/events/stream", householdId: "household-a", sourceFactory: () => source });
    const received: string[] = [];
    client.onEvent((event) => received.push(event.eventId));
    client.connect();
    source.emit("proprium.future.event.v9", { eventId: "unknown" });
    const billUpdate = { eventId: "evt-1", eventType: "proprium.bill.updated.v1", eventVersion: 1, occurredAtUtc: "2026-09-09T00:00:00Z", correlationId: "corr", causationId: null, actorId: null, scope: { householdId: "household-a", userId: null, entityId: "bill-1" }, data: { billId: "bill-1", amount: 1, dueDate: "2026-10-09" } };
    source.emit("proprium.bill.updated.v1", billUpdate);
    source.emit("proprium.bill.updated.v1", billUpdate);
    expect(received).toEqual(["evt-1"]);
  });
});
