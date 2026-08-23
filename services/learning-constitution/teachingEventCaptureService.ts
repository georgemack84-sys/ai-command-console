import type {
  ProvenanceLedger,
  TeachingEvent,
  TeachingEventCaptureRequest,
  TeachingEventCaptureResult,
} from "../../types/learning-constitution/provenance";

export const TEACHING_EVENT_CAPTURE_SERVICE_ID = "noesis-teaching-event-capture-service:v1";

type Dependencies = Readonly<{
  ledger: ProvenanceLedger;
  now?: () => string;
  createId?: () => string;
}>;

const result = (values: Omit<TeachingEventCaptureResult, "authorityEffect" | "executionPermissionGranted">): TeachingEventCaptureResult => ({
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

/**
 * Captures what was supplied, exactly as supplied. This service deliberately
 * has no classifier, extractor, validation, or durable-knowledge dependency.
 */
export class TeachingEventCaptureService {
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(private readonly dependencies: Dependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createId = dependencies.createId ?? (() => `TE-${crypto.randomUUID()}`);
  }

  async capture(request: TeachingEventCaptureRequest): Promise<TeachingEventCaptureResult> {
    if (!request.originalContent.trim()) return result({ status: "REJECTED", reasonCode: "CONTENT_MISSING", created: false, persistenceEffect: "NONE" });
    if (!request.sourceActor.actorId.trim()) return result({ status: "REJECTED", reasonCode: "ACTOR_UNKNOWN", created: false, persistenceEffect: "NONE" });
    const receivedAt = request.receivedAt ?? this.now();
    if (Number.isNaN(Date.parse(receivedAt))) return result({ status: "REJECTED", reasonCode: "TIMESTAMP_INVALID", created: false, persistenceEffect: "NONE" });
    const teachingEvent: TeachingEvent = {
      id: this.createId(),
      recordType: "TEACHING_EVENT",
      sourceType: request.sourceType,
      sourceActor: request.sourceActor,
      originalContent: request.originalContent,
      receivedAt,
      scopeHint: request.scopeHint,
      immutable: true,
    };
    try {
      const persisted = await this.dependencies.ledger.append(teachingEvent) as TeachingEvent;
      return result({ status: "CAPTURED", reasonCode: "TEACHING_EVENT_CAPTURED", teachingEvent: persisted, created: true, persistenceEffect: "CREATED" });
    } catch {
      return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", created: false, persistenceEffect: "NONE" });
    }
  }
}
