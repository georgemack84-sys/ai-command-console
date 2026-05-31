import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import { aggregateUnifiedAdvisory, type UnifiedAdvisoryAggregationResult } from "./unifiedAdvisoryAggregation";

export type AdvisoryReadModel = Readonly<{
  generatedAt: string;
  unifiedStatus: "NORMAL" | "WATCH" | "CAUTION" | "ESCALATE" | "DISPUTED" | "FAILED";
  unifiedRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  sourceBreakdown: readonly Readonly<{
    source: string;
    status: string;
    risk?: string;
    replayable: boolean;
    evidenceAvailable: boolean;
    present: boolean;
  }>[];
  conflicts: readonly Readonly<{
    source: string;
    reason: string;
  }>[];
  evidenceCompleteness: Readonly<{
    available: number;
    missing: number;
  }>;
  replayability: Readonly<{
    replayableSources: number;
    nonReplayableSources: number;
  }>;
  snapshotHash: string;
  authority: "READ_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
}>;

export type BuildAdvisoryReadModelOptions = Readonly<{
  aggregation?: UnifiedAdvisoryAggregationResult;
  generatedAt?: string;
}>;

function sourceHasConflict(aggregation: UnifiedAdvisoryAggregationResult, source: string, reason: string) {
  return aggregation.conflicts.some((conflict) => conflict.source === source && conflict.reason === reason);
}

function buildSourceBreakdown(aggregation: UnifiedAdvisoryAggregationResult): AdvisoryReadModel["sourceBreakdown"] {
  return aggregation.sourceStatuses.map((source) => {
    const replayable = source.present && !sourceHasConflict(aggregation, source.source, "SOURCE_NOT_REPLAYABLE");
    return Object.freeze({
      source: source.source,
      status: source.status,
      ...(source.risk ? { risk: source.risk } : {}),
      replayable,
      evidenceAvailable: Boolean(source.evidenceHash),
      present: source.present,
    });
  });
}

function hashReadModelSnapshot(input: Omit<AdvisoryReadModel, "generatedAt" | "snapshotHash">) {
  return `sha256:${hashPayloadDeterministically({
    conflicts: input.conflicts,
    evidenceCompleteness: input.evidenceCompleteness,
    replayability: input.replayability,
    sourceBreakdown: input.sourceBreakdown,
    unifiedRisk: input.unifiedRisk,
    unifiedStatus: input.unifiedStatus,
  })}`;
}

export function buildAdvisoryReadModel(options: BuildAdvisoryReadModelOptions = {}): AdvisoryReadModel {
  const aggregation = options.aggregation || aggregateUnifiedAdvisory({});
  const sourceBreakdown = buildSourceBreakdown(aggregation);
  const evidenceCompleteness = {
    available: sourceBreakdown.filter((source) => source.evidenceAvailable).length,
    missing: sourceBreakdown.filter((source) => !source.evidenceAvailable).length,
  };
  const replayability = {
    replayableSources: sourceBreakdown.filter((source) => source.replayable).length,
    nonReplayableSources: sourceBreakdown.filter((source) => !source.replayable).length,
  };
  const modelWithoutHash = {
    unifiedStatus: aggregation.status,
    unifiedRisk: aggregation.risk,
    sourceBreakdown: Object.freeze(sourceBreakdown),
    conflicts: Object.freeze(aggregation.conflicts.map((conflict) => Object.freeze({
      source: conflict.source,
      reason: conflict.reason,
    }))),
    evidenceCompleteness: Object.freeze(evidenceCompleteness),
    replayability: Object.freeze(replayability),
    authority: "READ_ONLY" as const,
    mayDeploy: false as const,
    mayRetry: false as const,
    mayRollback: false as const,
    mayCancel: false as const,
    mayResume: false as const,
    mayApprove: false as const,
    mayOverride: false as const,
  };

  return Object.freeze({
    generatedAt: options.generatedAt || new Date().toISOString(),
    ...modelWithoutHash,
    snapshotHash: hashReadModelSnapshot(modelWithoutHash),
  });
}
