import type {
  SourceRegistryEvent,
  SourceRegistryObject,
  SourceRegistrationResult,
} from "../schemas/sourceRegistryTypes";
import { createSourceRegistryEvent, createSourceRegistryEventLog } from "../events/sourceRegistryEvents";
import { validateSourceRegistryObject } from "../validators/sourceRegistryValidator";

export interface SourceRegistryStore {
  registerSource(source: SourceRegistryObject): SourceRegistrationResult;
  getSourceById(sourceId: string): SourceRegistryObject | undefined;
  listSources(): SourceRegistryObject[];
  listEvents(): SourceRegistryEvent[];
  isSourceRegistered(sourceId: string): boolean;
  isSourceActive(sourceId: string): boolean;
  rejectDuplicateSource(sourceId: string): { status: "VALID" | "REJECTED"; reason: string };
}

export function createSourceRegistryStore(initialSources: SourceRegistryObject[] = []): SourceRegistryStore {
  const sources = new Map<string, SourceRegistryObject>();
  const eventLog = createSourceRegistryEventLog();

  for (const source of initialSources) {
    sources.set(source.source_id, { ...source });
  }

  return {
    registerSource(source) {
      const existingSourceIds = new Set(sources.keys());
      const validation = validateSourceRegistryObject(source, existingSourceIds);

      if (validation.status === "REJECTED") {
        const duplicate = validation.reasons.includes("duplicate source_id is rejected");
        const event = createSourceRegistryEvent({
          source_id: source.source_id || "unknown_source",
          event_type: duplicate ? "DUPLICATE_SOURCE_REJECTED" : "SOURCE_REJECTED",
          severity: "WARN",
          reason: validation.reasons.join("; "),
          timestamp: source.created_at,
        });
        eventLog.record(event);

        return {
          status: "REJECTED",
          events: [event],
          reasons: validation.reasons,
        };
      }

      const record = { ...source };
      sources.set(record.source_id, record);

      const event = createSourceRegistryEvent({
        source_id: record.source_id,
        event_type: "SOURCE_REGISTERED",
        reason: "Source registered.",
        timestamp: record.created_at,
      });
      eventLog.record(event);

      return {
        status: "REGISTERED",
        source: { ...record },
        events: [event],
        reasons: [],
      };
    },
    getSourceById(sourceId) {
      const source = sources.get(sourceId);
      return source ? { ...source } : undefined;
    },
    listSources() {
      return Array.from(sources.values()).map((source) => ({ ...source }));
    },
    listEvents() {
      return eventLog.list();
    },
    isSourceRegistered(sourceId) {
      return sources.has(sourceId);
    },
    isSourceActive(sourceId) {
      return sources.get(sourceId)?.status === "ACTIVE";
    },
    rejectDuplicateSource(sourceId) {
      if (sources.has(sourceId)) {
        return { status: "REJECTED", reason: "duplicate source_id is rejected" };
      }

      return { status: "VALID", reason: "source_id is available" };
    },
  };
}
