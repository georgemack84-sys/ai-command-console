import type { DeferredCandidateLifecycleService } from "./deferredCandidateLifecycleService";
import type { DeferredCandidateRegistry } from "../../types/learning-constitution/deferredCandidateLifecycle";
import type { DeferredCandidateReevaluationInputProvider, DeferredCandidateResolutionEvent, DeferredCandidateResolutionLedger, DeferredCandidateResolutionResult } from "../../types/learning-constitution/deferredCandidateResolution";

/** Records resolution provenance first, then requires a new full gate evaluation. */
export class DeferredCandidateResolutionService {
  constructor(private readonly dependencies: Readonly<{
    registry: DeferredCandidateRegistry;
    resolutionLedger: DeferredCandidateResolutionLedger;
    reevaluationInputProvider: DeferredCandidateReevaluationInputProvider;
    lifecycle: DeferredCandidateLifecycleService;
  }>) {}

  async resolve(deferredCandidateId: string, resolution: DeferredCandidateResolutionEvent): Promise<DeferredCandidateResolutionResult | undefined> {
    const candidate = await this.dependencies.registry.get(deferredCandidateId);
    if (!candidate || candidate.candidateId !== resolution.candidateId || candidate.status !== "PENDING") return undefined;

    const recorded = await this.dependencies.resolutionLedger.append(resolution);
    const reevaluationInput = await this.dependencies.reevaluationInputProvider.build({ candidate, resolution: recorded });
    const reevaluation = await this.dependencies.lifecycle.reevaluate(deferredCandidateId, reevaluationInput);
    return {
      resolution: recorded,
      reevaluation,
      persistenceEffect: "CREATED",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }
}

export class InMemoryDeferredCandidateResolutionLedger implements DeferredCandidateResolutionLedger {
  private readonly events = new Map<string, DeferredCandidateResolutionEvent>();
  async append(event: DeferredCandidateResolutionEvent): Promise<DeferredCandidateResolutionEvent> {
    const existing = this.events.get(event.eventId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(event)) throw new Error("resolution event id collision");
    this.events.set(event.eventId, existing ?? event);
    return existing ?? event;
  }
  async findByCandidateId(candidateId: string): Promise<readonly DeferredCandidateResolutionEvent[]> {
    return [...this.events.values()].filter((event) => event.candidateId === candidateId).sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId));
  }
}
