type ReplayEvent = Record<string, unknown>;

function eventOrderValue(event: ReplayEvent, index: number) {
  const candidate = event.sequence ?? event.seq ?? event.ledgerIndex ?? event.order ?? index;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : index;
}

export function buildReplaySequence(ledgerEvents: ReplayEvent[] = []) {
  return [...ledgerEvents]
    .map((event, index) => ({
      event,
      index,
      orderValue: eventOrderValue(event, index),
      eventType: String(event.eventType || event.type || "unknown"),
    }))
    .sort((left, right) => {
      if (left.orderValue !== right.orderValue) {
        return left.orderValue - right.orderValue;
      }
      return left.index - right.index;
    });
}
