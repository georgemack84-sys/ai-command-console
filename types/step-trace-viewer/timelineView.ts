export type TimelineProjectionEvent = Readonly<{
  eventId: string;
  eventType: string;
  timestamp: string;
  monotonicSequence: number;
  validator?: string;
  parentEventId?: string;
  rootEventId?: string;
  severity: string;
  evidenceHash: string;
  errorCode?: string;
}>;

export type TimelineProjection = Readonly<{
  timelineId: string;
  rootEventId: string;
  events: readonly TimelineProjectionEvent[];
  deterministic: boolean;
  visibleEventCount: number;
  timelineHash: string;
}>;
