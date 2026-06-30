import type { ChangeEvent } from "./changeDetectionTypes";

export function createChangeEventStore(initialEvents: ChangeEvent[] = []) {
  const events = initialEvents.map((event) => ({ ...event }));

  return {
    record(event: ChangeEvent) {
      const record = { ...event };
      events.push(record);
      return { status: "RECORDED" as const, event: { ...record } };
    },
    list() {
      return events.map((event) => ({ ...event }));
    },
  };
}
