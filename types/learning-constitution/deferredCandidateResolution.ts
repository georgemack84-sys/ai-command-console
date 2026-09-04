import type { DeferredCandidateReevaluationInput, DeferredCandidateReevaluationResult, DeferredCandidateRecord } from "./deferredCandidateLifecycle";

export const DEFERRED_CANDIDATE_RESOLUTION_KINDS = ["APPROVAL", "CLARIFICATION", "EVIDENCE"] as const;
export type DeferredCandidateResolutionKind = (typeof DEFERRED_CANDIDATE_RESOLUTION_KINDS)[number];

/** Immutable provenance of a human or evidence event; it does not promote knowledge. */
export type DeferredCandidateResolutionEvent = Readonly<{
  eventId: string;
  candidateId: string;
  kind: DeferredCandidateResolutionKind;
  actorId: string;
  summary: string;
  evidenceRefs: readonly string[];
  occurredAt: string;
}>;

export interface DeferredCandidateResolutionLedger {
  append(event: DeferredCandidateResolutionEvent): Promise<DeferredCandidateResolutionEvent>;
  findByCandidateId(candidateId: string): Promise<readonly DeferredCandidateResolutionEvent[]>;
}

export interface DeferredCandidateReevaluationInputProvider {
  build(input: Readonly<{
    candidate: DeferredCandidateRecord;
    resolution: DeferredCandidateResolutionEvent;
  }>): Promise<DeferredCandidateReevaluationInput>;
}

export type DeferredCandidateResolutionResult = Readonly<{
  resolution: DeferredCandidateResolutionEvent;
  reevaluation: DeferredCandidateReevaluationResult;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
