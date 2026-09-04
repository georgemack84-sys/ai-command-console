import type { DurableLearningGateHealth, GateAuditEventReader } from "../../types/learning-constitution/gateObservability";

const outcomes = () => ({ ACCEPT: 0, DEFER: 0, REJECT: 0 });

/** Derives a manager-safe health view without mutating, filtering, or repairing audit history. */
export class GateObservabilityService {
  constructor(private readonly audit: GateAuditEventReader) {}

  async summarize(): Promise<DurableLearningGateHealth> {
    const [events, integrity] = await Promise.all([this.audit.listEvents(), this.audit.verifyIntegrity()]);
    const counts = outcomes();
    const reasonCounts: Record<string, number> = {};
    const candidateEvaluations = new Map<string, number>();
    for (const event of events) {
      counts[event.decision.outcome] += 1;
      candidateEvaluations.set(event.decision.candidateId, (candidateEvaluations.get(event.decision.candidateId) ?? 0) + 1);
      for (const reason of event.decision.reasonCodes) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
    }
    const latest = [...events].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];
    return {
      totalEvaluations: events.length,
      outcomes: counts,
      reasonCounts,
      constitutionalVetoCount: reasonCounts.CONSTITUTIONAL_VETO ?? 0,
      validationFailureCount: reasonCounts.VALIDATION_FAILED ?? 0,
      conflictDeferralCount: reasonCounts.CONFLICT_UNRESOLVED ?? 0,
      authorityDenialCount: (reasonCounts.AUTHORITY_INSUFFICIENT ?? 0) + (reasonCounts.AUTHORITY_UNCERTAIN ?? 0),
      reEvaluationCount: [...candidateEvaluations.values()].reduce((total, count) => total + Math.max(0, count - 1), 0),
      auditIntegrity: integrity ? "VERIFIED" : "UNAVAILABLE",
      currentGateVersion: latest?.decision.context.gateVersion,
      latestEvaluationAt: latest?.occurredAt,
    };
  }
}
