import crypto from "node:crypto";
import type { CivitasEvent, CivitasEventName } from "@/lib/civitas/types";

const events: CivitasEvent[] = [];

export function emitCivitasEvent(name: CivitasEventName, payload: Record<string, unknown>, correlationId = createId("corr")) {
  const event: CivitasEvent = {
    id: createId("evt"),
    name,
    payload: Object.freeze({ ...payload }),
    timestamp: new Date().toISOString(),
    correlationId,
    replayId: createId("replay"),
    immutable: true,
  };
  events.unshift(Object.freeze(event));
  events.splice(100);
  return event;
}

export function listCivitasEvents() {
  return [...events];
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}
