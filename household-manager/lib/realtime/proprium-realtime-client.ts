import { isPropriumEvent, type PropriumEvent, type RealtimeConnectionStatus } from "./contracts";

type EventSourceListener = (event: Event) => void;

export interface EventSourceConnection {
  close(): void;
  addEventListener(type: string, listener: EventSourceListener): void;
  removeEventListener(type: string, listener: EventSourceListener): void;
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
}

export type EventSourceFactory = (url: string) => EventSourceConnection;

export type PropriumRealtimeClientOptions = {
  endpoint: string;
  householdId: string;
  sourceFactory?: EventSourceFactory;
  retryScheduleMs?: readonly number[];
};

export class PropriumRealtimeClient {
  private static readonly eventTypes = ["proprium.bill.updated.v1", "proprium.bill.created.v1", "proprium.bill.paid.v1", "proprium.bill.unpaid.v1"] as const;
  private readonly handlers = new Set<(event: PropriumEvent) => void>();
  private readonly statusHandlers = new Set<(status: RealtimeConnectionStatus) => void>();
  private readonly sourceFactory: EventSourceFactory;
  private readonly retryScheduleMs: readonly number[];
  private readonly processedEventIds = new Set<string>();
  private source: EventSourceConnection | null = null;
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: RealtimeConnectionStatus = "DISCONNECTED";

  public constructor(private readonly options: PropriumRealtimeClientOptions) {
    this.sourceFactory = options.sourceFactory ?? ((url) => new EventSource(url, { withCredentials: true }));
    this.retryScheduleMs = options.retryScheduleMs ?? [1_000, 2_000, 5_000, 10_000, 30_000];
  }

  public connect(): void {
    if (this.source) return;
    this.setStatus(this.retryCount === 0 ? "CONNECTING" : "RECONNECTING");
    const source = this.sourceFactory(this.streamUrl());
    this.source = source;
    source.onopen = () => {
      this.retryCount = 0;
      this.setStatus("CONNECTED");
    };
    source.onerror = () => this.scheduleReconnect();
    for (const eventType of PropriumRealtimeClient.eventTypes) source.addEventListener(eventType, this.handleMessage);
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.closeSource();
    this.retryCount = 0;
    this.setStatus("DISCONNECTED");
  }

  public onEvent(handler: (event: PropriumEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public onStatus(handler: (status: RealtimeConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  private readonly handleMessage: EventSourceListener = (message) => {
    try {
      const event: unknown = JSON.parse((message as MessageEvent<string>).data);
      if (!isPropriumEvent(event)) return;
      if (this.processedEventIds.has(event.eventId)) return;
      this.processedEventIds.add(event.eventId);
      if (this.processedEventIds.size > 1_000) this.processedEventIds.delete(this.processedEventIds.values().next().value!);
      for (const handler of this.handlers) handler(event);
    } catch {
      // Network contracts evolve independently; malformed or unknown events are ignored safely.
    }
  };

  private scheduleReconnect(): void {
    this.closeSource();
    if (this.reconnectTimer) return;
    const delay = this.retryScheduleMs[Math.min(this.retryCount, this.retryScheduleMs.length - 1)];
    this.retryCount++;
    this.setStatus(this.retryCount > this.retryScheduleMs.length ? "DEGRADED" : "RECONNECTING");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private closeSource(): void {
    if (!this.source) return;
    for (const eventType of PropriumRealtimeClient.eventTypes) this.source.removeEventListener(eventType, this.handleMessage);
    this.source.close();
    this.source = null;
  }

  private setStatus(status: RealtimeConnectionStatus): void {
    this.status = status;
    for (const handler of this.statusHandlers) handler(status);
  }

  private streamUrl(): string {
    const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(this.options.endpoint, baseUrl);
    url.searchParams.set("householdId", this.options.householdId);
    return url.toString();
  }
}
