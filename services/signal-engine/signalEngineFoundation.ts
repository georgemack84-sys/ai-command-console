import { createHash } from "crypto";
import { assertExplanationAllowed } from "./explanationGuardrails";
import { evaluateConsensusDivergenceSignal } from "./consensusDivergenceSignal";
import { evaluateReverseLineMovementSignal } from "./reverseLineMovementSignal";
import { classifySignal } from "./signalClassifier";
import { createSignalRegistry, getSignalRegistryEntry, isKnownSignalType } from "./signalRegistry";
import { evaluateSteamMovementSignal } from "./steamMovementSignal";
import { evaluateVolatilitySpikeSignal } from "./volatilitySpikeSignal";
import type {
  ConfidenceScore,
  ConsensusDivergenceConfidenceFactors,
  ConsensusDivergenceEvidence,
  ConsensusDivergenceSignalEvaluation,
  ConsensusDivergenceThresholds,
  EvidenceChain,
  MarketSignal,
  ReplayReference,
  ReverseLineConfidenceFactors,
  ReverseLineMovementEvidence,
  ReverseLineMovementThresholds,
  ReverseLineSignalEvaluation,
  SignalClassifierResult,
  SignalEngineResult,
  SignalRegistry,
  SignalType,
  SteamConfidenceFactors,
  SteamMovementEvidence,
  SteamMovementThresholds,
  SteamSignalEvaluation,
  VolatilitySpikeConfidenceFactors,
  VolatilitySpikeEvidence,
  VolatilitySpikeSignalEvaluation,
  VolatilitySpikeThresholds,
  VerifiedMovementEvent,
} from "./types";

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function buildConfidenceScore(event: VerifiedMovementEvent, reasons: string[]): ConfidenceScore {
  const sourceWeight = Math.min(0.4, event.source_ids.length * 0.15);
  const observationWeight = Math.min(0.3, event.evidence.observations_used.length * 0.05);
  const movementWeight = Math.min(0.3, event.evidence.movement_events_used.length * 0.1);
  const value = Number(Math.min(1, 0.2 + sourceWeight + observationWeight + movementWeight).toFixed(4));
  const tier = value >= 0.75 ? "HIGH" : value >= 0.45 ? "MEDIUM" : "LOW";
  return Object.freeze({
    value,
    tier,
    reasons: [...reasons],
    scoring_version: "signal-confidence/v1",
  });
}

function buildSteamConfidenceScore(confidenceFactors: SteamConfidenceFactors, reasons: string[]): ConfidenceScore {
  const sourceWeight = Math.min(0.3, confidenceFactors.source_count * 0.1);
  const alignmentWeight = Math.min(0.25, confidenceFactors.alignment_ratio * 0.25);
  const movementWeight = Math.min(0.2, confidenceFactors.movement_size / 10);
  const speedWeight =
    confidenceFactors.movement_speed_state === "SPIKE"
      ? 0.25
      : confidenceFactors.movement_speed_state === "FAST"
        ? 0.18
        : confidenceFactors.movement_speed_state === "NORMAL"
          ? 0.1
          : 0.02;
  const completenessWeight = confidenceFactors.evidence_completeness ? 0.05 : 0;
  const value = Number(Math.min(1, sourceWeight + alignmentWeight + movementWeight + speedWeight + completenessWeight).toFixed(4));
  const tier = value >= 0.8 ? "HIGH" : value >= 0.5 ? "MEDIUM" : "LOW";
  return Object.freeze({
    value,
    tier,
    reasons: [...reasons],
    scoring_version: "steam-confidence/v1",
  });
}

function buildReverseLineConfidenceScore(
  confidenceFactors: ReverseLineConfidenceFactors,
  reasons: string[],
): ConfidenceScore {
  const publicWeight = Math.min(0.35, confidenceFactors.public_percentage / 200);
  const movementWeight = Math.min(0.2, confidenceFactors.movement_size / 5);
  const sourceWeight = Math.min(0.2, confidenceFactors.source_count * 0.08);
  const freshnessWeight =
    confidenceFactors.consensus_age_seconds <= 120
      ? 0.2
      : confidenceFactors.consensus_age_seconds <= 600
        ? 0.12
        : 0.05;
  const verificationWeight = confidenceFactors.consensus_verification_status === "VERIFIED" ? 0.1 : 0.03;
  const completenessWeight = confidenceFactors.evidence_completeness ? 0.05 : 0;
  const limitedConsensusPenalty = confidenceFactors.consensus_verification_status === "LIMITED" ? 0.18 : 0;
  const value = Number(
    Math.max(
      0,
      Math.min(1, publicWeight + movementWeight + sourceWeight + freshnessWeight + verificationWeight + completenessWeight - limitedConsensusPenalty),
    ).toFixed(4),
  );
  const tier = value >= 0.8 ? "HIGH" : value >= 0.5 ? "MEDIUM" : "LOW";
  return Object.freeze({
    value,
    tier,
    reasons: [...reasons],
    scoring_version: "reverse-line-confidence/v1",
  });
}

function buildConsensusDivergenceConfidenceScore(
  confidenceFactors: ConsensusDivergenceConfidenceFactors,
  reasons: string[],
): ConfidenceScore {
  const sourceWeight = Math.min(0.25, confidenceFactors.source_count * 0.08);
  const divergenceWeight =
    confidenceFactors.divergence_state === "SEVERE"
      ? 0.35
      : confidenceFactors.divergence_state === "MEANINGFUL"
        ? 0.22
        : confidenceFactors.divergence_state === "MINOR"
          ? 0.08
          : 0;
  const sizeWeight = Math.min(0.15, confidenceFactors.divergence_size / 10);
  const currentWeight = Math.min(0.15, confidenceFactors.current_source_count * 0.05);
  const stalePenalty = Math.min(0.12, confidenceFactors.stale_source_count * 0.04);
  const limitedPenalty = Math.min(0.12, confidenceFactors.limited_source_count * 0.05);
  const completenessWeight = confidenceFactors.evidence_completeness ? 0.1 : 0;
  const value = Number(
    Math.max(0, Math.min(1, sourceWeight + divergenceWeight + sizeWeight + currentWeight + completenessWeight - stalePenalty - limitedPenalty)).toFixed(4),
  );
  const tier = value >= 0.8 ? "HIGH" : value >= 0.5 ? "MEDIUM" : "LOW";
  return Object.freeze({
    value,
    tier,
    reasons: [...reasons],
    scoring_version: "consensus-divergence-confidence/v1",
  });
}

function buildVolatilitySpikeConfidenceScore(
  confidenceFactors: VolatilitySpikeConfidenceFactors,
  reasons: string[],
): ConfidenceScore {
  const countWeight = Math.min(0.2, confidenceFactors.movement_count * 0.05);
  const changeWeight = Math.min(0.2, confidenceFactors.largest_change / 5);
  const directionWeight = Math.min(0.15, confidenceFactors.direction_changes * 0.08);
  const frequencyWeight = Math.min(0.2, confidenceFactors.movements_per_minute / 2);
  const sourceWeight = Math.min(0.15, confidenceFactors.source_count * 0.05);
  const completenessWeight = confidenceFactors.evidence_completeness ? 0.1 : 0;
  const value = Number(Math.min(1, countWeight + changeWeight + directionWeight + frequencyWeight + sourceWeight + completenessWeight).toFixed(4));
  const tier = value >= 0.8 ? "HIGH" : value >= 0.5 ? "MEDIUM" : "LOW";
  return Object.freeze({
    value,
    tier,
    reasons: [...reasons],
    scoring_version: "volatility-spike-confidence/v1",
  });
}

function buildEvidenceChain(
  event: VerifiedMovementEvent,
  createdAt: string,
  steamEvidence?: SteamMovementEvidence,
  reverseLineEvidence?: ReverseLineMovementEvidence,
  consensusDivergenceEvidence?: ConsensusDivergenceEvidence,
  volatilitySpikeEvidence?: VolatilitySpikeEvidence,
): EvidenceChain {
  const baseEvidenceChain: EvidenceChain = {
    evidence_chain_id: `evidence_chain_${hashDeterministically([
      event.event_id,
      event.market_id,
      event.source_ids.join(","),
      createdAt,
    ])}`,
    market_id: event.market_id,
    source_ids: [...event.source_ids].sort(),
    observations_used: [...event.evidence.observations_used].sort(),
    movement_events_used: [...event.evidence.movement_events_used].sort(),
    required_evidence_present: event.evidence.required_evidence_present,
    evidence_summary: event.evidence.evidence_summary,
    created_at: createdAt,
  };

  if (!steamEvidence) {
    if (!reverseLineEvidence) {
      if (!consensusDivergenceEvidence) {
        if (!volatilitySpikeEvidence) {
          return Object.freeze(baseEvidenceChain);
        }
        return Object.freeze({
          ...baseEvidenceChain,
          movement_count: volatilitySpikeEvidence.movement_count,
          movement_sequence: volatilitySpikeEvidence.movement_sequence,
          largest_change: volatilitySpikeEvidence.largest_change,
          direction_changes: volatilitySpikeEvidence.direction_changes,
          time_window: volatilitySpikeEvidence.time_window,
          source_count: volatilitySpikeEvidence.source_count,
          timestamp: volatilitySpikeEvidence.timestamp,
          volatility_state: volatilitySpikeEvidence.volatility_state,
          frequency_metrics: volatilitySpikeEvidence.frequency_metrics,
        });
      }
      return Object.freeze({
        ...baseEvidenceChain,
        source_values: consensusDivergenceEvidence.source_values,
        highest_value: consensusDivergenceEvidence.highest_value,
        lowest_value: consensusDivergenceEvidence.lowest_value,
        divergence_size: consensusDivergenceEvidence.divergence_size,
        source_count: consensusDivergenceEvidence.source_count,
        market_type: consensusDivergenceEvidence.market_type,
        timestamp: consensusDivergenceEvidence.timestamp,
        divergence_state: consensusDivergenceEvidence.divergence_state,
        source_alignment: consensusDivergenceEvidence.source_alignment,
        freshness_summary: consensusDivergenceEvidence.freshness_summary,
      });
    }
    return Object.freeze({
      ...baseEvidenceChain,
      public_side: reverseLineEvidence.public_side,
      public_percentage: reverseLineEvidence.public_percentage,
      opposing_side: reverseLineEvidence.opposing_side,
      movement_direction: reverseLineEvidence.movement_direction,
      market_side_strengthened: reverseLineEvidence.market_side_strengthened,
      previous_line: reverseLineEvidence.previous_line,
      new_line: reverseLineEvidence.new_line,
      timestamp: reverseLineEvidence.timestamp,
      public_consensus_reference: reverseLineEvidence.public_consensus_reference,
      comparison_result: reverseLineEvidence.comparison_result,
    });
  }

  return Object.freeze({
    ...baseEvidenceChain,
    previous_values: steamEvidence.previous_values,
    new_values: steamEvidence.new_values,
    source_count: steamEvidence.source_count,
    movement_direction: steamEvidence.movement_direction,
    movement_size: steamEvidence.movement_size,
    time_window: steamEvidence.time_window,
    timestamps: steamEvidence.timestamps,
    movement_speed: steamEvidence.movement_speed,
    source_alignment: steamEvidence.source_alignment,
  });
}

function buildReplayReference(
  event: VerifiedMovementEvent,
  registry: SignalRegistry,
  engineVersion: string,
  steamEvaluation?: Extract<SteamSignalEvaluation, { status: "SIGNAL" }>,
  reverseLineEvaluation?: Extract<ReverseLineSignalEvaluation, { status: "SIGNAL" }>,
  consensusDivergenceEvaluation?: Extract<ConsensusDivergenceSignalEvaluation, { status: "SIGNAL" }>,
  volatilitySpikeEvaluation?: Extract<VolatilitySpikeSignalEvaluation, { status: "SIGNAL" }>,
): ReplayReference {
  return Object.freeze({
    input_event_id: event.event_id,
    validation_record_id: event.validation_record_id,
    registry_version: registry.registryVersion,
    engine_version: engineVersion,
    schema_version: event.schema_version,
    replay_input: steamEvaluation?.replay_input ?? reverseLineEvaluation?.replay_input ?? consensusDivergenceEvaluation?.replay_input ?? volatilitySpikeEvaluation?.replay_input,
  });
}

function buildExplanation(
  signalType: SignalType,
  steamEvidence?: SteamMovementEvidence,
  reverseLineEvidence?: ReverseLineMovementEvidence,
  consensusDivergenceEvidence?: ConsensusDivergenceEvidence,
  volatilitySpikeEvidence?: VolatilitySpikeEvidence,
): string {
  const explanations: Record<SignalType, string> = {
    STEAM_MOVEMENT:
      steamEvidence
        ? [
            "Steam movement detected.",
            `The market moved from ${String(steamEvidence.previous_values[0]?.value ?? "unknown")} to ${String(steamEvidence.new_values[0]?.value ?? "unknown")} across ${steamEvidence.source_count} verified sources.`,
            `Movement occurred within ${steamEvidence.time_window.duration_seconds} seconds.`,
            "Multiple verified sources moved in the same direction.",
            `Verified sources moved in the same direction: ${steamEvidence.movement_direction.toLowerCase().replaceAll("_", " ")}.`,
            "Market pressure detected.",
            "Observation may indicate coordinated market activity.",
            "Risk status: informational only.",
            "No betting recommendation generated.",
          ].join(" ")
        : "Steam movement detected. Market pressure detected. Multiple verified sources moved in the same direction. Observation may indicate coordinated market activity. Risk status: informational only. No betting recommendation generated.",
    REVERSE_LINE_MOVEMENT:
      reverseLineEvidence
        ? [
            "Reverse line movement detected.",
            `Public consensus favored ${reverseLineEvidence.public_side} at ${reverseLineEvidence.public_percentage}%.`,
            `Verified market movement strengthened ${reverseLineEvidence.market_side_strengthened}.`,
            "Market movement diverges from public consensus.",
            "Observation may indicate stronger market activity on the less popular side.",
            "Risk status: informational only.",
            "No betting recommendation generated.",
          ].join(" ")
        : "Reverse line movement detected. Market movement diverges from public consensus. Observation may indicate stronger market activity on the less popular side. Risk status: informational only. No betting recommendation generated.",
    CONSENSUS_DIVERGENCE:
      consensusDivergenceEvidence
        ? [
            "Consensus divergence detected.",
            `Verified sources are showing different ${consensusDivergenceEvidence.market_type.toLowerCase()} values for the same market.`,
            `Highest value: ${String(consensusDivergenceEvidence.highest_value)}.`,
            `Lowest value: ${String(consensusDivergenceEvidence.lowest_value)}.`,
            `Divergence size: ${consensusDivergenceEvidence.divergence_size}.`,
            `Source count: ${consensusDivergenceEvidence.source_count}.`,
            "Market consensus is not aligned.",
            "Observation may indicate uncertainty, stale pricing, or early movement.",
            "Risk status: informational only.",
            "No betting recommendation generated.",
          ].join(" ")
        : "Consensus divergence detected. Market consensus is not aligned. Observation may indicate uncertainty, stale pricing, or early movement. Risk status: informational only. No betting recommendation generated.",
    VOLATILITY_SPIKE:
      volatilitySpikeEvidence
        ? [
            "Volatility spike detected.",
            `The market recorded ${volatilitySpikeEvidence.movement_count} movement(s) inside ${volatilitySpikeEvidence.time_window.duration_seconds} seconds.`,
            `Largest movement: ${volatilitySpikeEvidence.largest_change.movement_size}.`,
            `Direction changes: ${volatilitySpikeEvidence.direction_changes}.`,
            `Movement frequency: ${volatilitySpikeEvidence.frequency_metrics.movements_per_minute} movement(s) per minute.`,
            "Market volatility increased.",
            "Observation may indicate uncertainty, breaking news, or unstable pricing.",
            "Risk status: informational only.",
            "No betting recommendation generated.",
          ].join(" ")
        : "Volatility spike detected. Market volatility increased. Observation may indicate uncertainty, breaking news, or unstable pricing. Risk status: informational only. No betting recommendation generated.",
    IMPLIED_PROBABILITY_SHIFT: "Verified source movement observed. Evidence chain attached. Risk status: informational only.",
    UNCLASSIFIED: "Market movement detected. Risk status: informational only.",
  };
  return explanations[signalType];
}

export interface SignalEngine {
  processEvent(event: VerifiedMovementEvent): SignalEngineResult;
  readonly registry: SignalRegistry;
}

export function createSignalEngine(
  options: {
    now?: () => Date;
    engineVersion?: string;
    registry?: SignalRegistry;
    classifier?: (event: VerifiedMovementEvent) => SignalClassifierResult;
    explanationBuilder?: (signalType: SignalType, event: VerifiedMovementEvent) => string;
    steamThresholds?: Partial<SteamMovementThresholds>;
    reverseLineThresholds?: Partial<ReverseLineMovementThresholds>;
    consensusDivergenceThresholds?: Partial<ConsensusDivergenceThresholds>;
    volatilitySpikeThresholds?: Partial<VolatilitySpikeThresholds>;
  } = {},
): SignalEngine {
  const now = options.now ?? (() => new Date());
  const engineVersion = options.engineVersion ?? "signal-engine/v1";
  const registry = options.registry ?? createSignalRegistry();
  const classifier = options.classifier ?? classifySignal;
  const steamThresholds = options.steamThresholds;
  const reverseLineThresholds = options.reverseLineThresholds;
  const consensusDivergenceThresholds = options.consensusDivergenceThresholds;
  const volatilitySpikeThresholds = options.volatilitySpikeThresholds;
  const explanationBuilder =
    options.explanationBuilder
    ?? ((signalType: SignalType, event: VerifiedMovementEvent) => buildExplanation(signalType));

  return {
    registry,
    processEvent(event) {
      if (!event.event_id || !event.event_type || !event.market_id || event.source_ids.length === 0 || !event.timestamp || !event.schema_version) {
        return {
          status: "REJECTED",
          reason: "Required movement event fields are missing.",
          rejection_code: "MISSING_REQUIRED_FIELD",
        };
      }
      if (event.verification_status !== "VERIFIED") {
        return {
          status: "REJECTED",
          reason: "Only verified movement events may produce signals.",
          rejection_code: "EVENT_NOT_VERIFIED",
        };
      }
      if (!event.validation_record_id) {
        return {
          status: "REJECTED",
          reason: "Replay reference is missing validation linkage.",
          rejection_code: "REPLAY_REFERENCE_MISSING",
        };
      }
      if (
        !event.evidence
        || !event.evidence.required_evidence_present
        || event.evidence.observations_used.length === 0
        || event.evidence.movement_events_used.length === 0
        || event.evidence.evidence_summary.trim().length === 0
      ) {
        return {
          status: "REJECTED",
          reason: "Evidence chain is required for informational signals.",
          rejection_code: "MISSING_EVIDENCE",
        };
      }

      const classification = classifier(event);
      if (classification.status === "NO_SIGNAL") {
        return {
          status: "NO_SIGNAL",
          reason: classification.reasons.join(" "),
        };
      }

      if (!isKnownSignalType(registry, classification.signalType)) {
        return {
          status: "REJECTED",
          reason: "Classifier returned an unknown signal type.",
          rejection_code: "UNKNOWN_SIGNAL_TYPE",
        };
      }

      const registryEntry = getSignalRegistryEntry(registry, classification.signalType);
      if (!registryEntry) {
        return {
          status: "REJECTED",
          reason: "Signal registry entry is missing.",
          rejection_code: "UNKNOWN_SIGNAL_TYPE",
        };
      }
      if (!registryEntry.enabled) {
        return {
          status: "REJECTED",
          reason: "Signal type is disabled in the registry.",
          rejection_code: "SIGNAL_TYPE_DISABLED",
        };
      }

      const evidenceFieldMap: Record<string, unknown> = {
        observations_used: event.evidence.observations_used,
        movement_events_used: event.evidence.movement_events_used,
      };
      const missingRequiredEvidence = registryEntry.requiredEvidence.some((requiredKey) => {
        const value = evidenceFieldMap[requiredKey];
        return !Array.isArray(value) || value.length === 0;
      });
      if (missingRequiredEvidence) {
        return {
          status: "REJECTED",
          reason: "Registry-required evidence was not present.",
          rejection_code: "MISSING_EVIDENCE",
        };
      }

      const createdAt = now().toISOString();
      const steamEvaluation =
        classification.signalType === "STEAM_MOVEMENT"
          ? evaluateSteamMovementSignal(event, steamThresholds)
          : undefined;
      const reverseLineEvaluation =
        classification.signalType === "REVERSE_LINE_MOVEMENT"
          ? evaluateReverseLineMovementSignal(event, reverseLineThresholds)
          : undefined;
      const consensusDivergenceEvaluation =
        classification.signalType === "CONSENSUS_DIVERGENCE"
          ? evaluateConsensusDivergenceSignal(event, consensusDivergenceThresholds)
          : undefined;
      const volatilitySpikeEvaluation =
        classification.signalType === "VOLATILITY_SPIKE"
          ? evaluateVolatilitySpikeSignal(event, volatilitySpikeThresholds)
          : undefined;
      if (classification.signalType === "STEAM_MOVEMENT" && steamEvaluation?.status === "REJECTED") {
        return {
          status: "REJECTED",
          reason: steamEvaluation.reasons.join(" "),
          rejection_code: steamEvaluation.rejection_code,
        };
      }
      if (classification.signalType === "STEAM_MOVEMENT" && steamEvaluation?.status !== "SIGNAL") {
        return {
          status: "NO_SIGNAL",
          reason: steamEvaluation?.reasons.join(" ") ?? "Steam movement thresholds were not met.",
        };
      }
      if (classification.signalType === "REVERSE_LINE_MOVEMENT" && reverseLineEvaluation?.status === "REJECTED") {
        return {
          status: "REJECTED",
          reason: reverseLineEvaluation.reasons.join(" "),
          rejection_code: reverseLineEvaluation.rejection_code,
        };
      }
      if (classification.signalType === "REVERSE_LINE_MOVEMENT" && reverseLineEvaluation?.status !== "SIGNAL") {
        return {
          status: "NO_SIGNAL",
          reason: reverseLineEvaluation?.reasons.join(" ") ?? "Reverse line movement thresholds were not met.",
        };
      }
      if (classification.signalType === "CONSENSUS_DIVERGENCE" && consensusDivergenceEvaluation?.status === "REJECTED") {
        return {
          status: "REJECTED",
          reason: consensusDivergenceEvaluation.reasons.join(" "),
          rejection_code: consensusDivergenceEvaluation.rejection_code,
        };
      }
      if (classification.signalType === "CONSENSUS_DIVERGENCE" && consensusDivergenceEvaluation?.status !== "SIGNAL") {
        return {
          status: "NO_SIGNAL",
          reason: consensusDivergenceEvaluation?.reasons.join(" ") ?? "Consensus divergence thresholds were not met.",
        };
      }
      if (classification.signalType === "VOLATILITY_SPIKE" && volatilitySpikeEvaluation?.status === "REJECTED") {
        return {
          status: "REJECTED",
          reason: volatilitySpikeEvaluation.reasons.join(" "),
          rejection_code: volatilitySpikeEvaluation.rejection_code,
        };
      }
      if (classification.signalType === "VOLATILITY_SPIKE" && volatilitySpikeEvaluation?.status !== "SIGNAL") {
        return {
          status: "NO_SIGNAL",
          reason: volatilitySpikeEvaluation?.reasons.join(" ") ?? "Volatility spike thresholds were not met.",
        };
      }

      const steamSignalEvaluation =
        steamEvaluation && steamEvaluation.status === "SIGNAL" ? steamEvaluation : undefined;
      const reverseSignalEvaluation =
        reverseLineEvaluation && reverseLineEvaluation.status === "SIGNAL" ? reverseLineEvaluation : undefined;
      const consensusSignalEvaluation =
        consensusDivergenceEvaluation && consensusDivergenceEvaluation.status === "SIGNAL" ? consensusDivergenceEvaluation : undefined;
      const volatilitySignalEvaluation =
        volatilitySpikeEvaluation && volatilitySpikeEvaluation.status === "SIGNAL" ? volatilitySpikeEvaluation : undefined;
      const evidenceChain = buildEvidenceChain(
        event,
        createdAt,
        steamSignalEvaluation?.evidence,
        reverseSignalEvaluation?.evidence,
        consensusSignalEvaluation?.evidence,
        volatilitySignalEvaluation?.evidence,
      );
      const replayReference = buildReplayReference(
        event,
        registry,
        engineVersion,
        steamSignalEvaluation,
        reverseSignalEvaluation,
        consensusSignalEvaluation,
        volatilitySignalEvaluation,
      );
      const explanation =
        classification.signalType === "STEAM_MOVEMENT" && !options.explanationBuilder
          ? buildExplanation("STEAM_MOVEMENT", steamSignalEvaluation?.evidence)
          : classification.signalType === "REVERSE_LINE_MOVEMENT" && !options.explanationBuilder
            ? buildExplanation("REVERSE_LINE_MOVEMENT", undefined, reverseSignalEvaluation?.evidence)
          : classification.signalType === "CONSENSUS_DIVERGENCE" && !options.explanationBuilder
            ? buildExplanation("CONSENSUS_DIVERGENCE", undefined, undefined, consensusSignalEvaluation?.evidence)
          : classification.signalType === "VOLATILITY_SPIKE" && !options.explanationBuilder
            ? buildExplanation("VOLATILITY_SPIKE", undefined, undefined, undefined, volatilitySignalEvaluation?.evidence)
          : explanationBuilder(classification.signalType, event);

      try {
        assertExplanationAllowed(explanation);
      } catch {
        return {
          status: "REJECTED",
          reason: "Explanation contains blocked recommendation language.",
          rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
        };
      }

      const signal: MarketSignal = Object.freeze({
        signal_id: `market_signal_${hashDeterministically([
          classification.signalType,
          event.market_id,
          event.event_id,
          registry.registryVersion,
          engineVersion,
          event.timestamp,
        ])}`,
        signal_type: classification.signalType,
        market_id: event.market_id,
        event_id: event.event_id,
        source_ids: [...event.source_ids].sort(),
        confidence_score:
          classification.signalType === "STEAM_MOVEMENT" && steamSignalEvaluation
            ? buildSteamConfidenceScore(steamSignalEvaluation.confidence_factors, classification.reasons)
            : classification.signalType === "REVERSE_LINE_MOVEMENT" && reverseSignalEvaluation
              ? buildReverseLineConfidenceScore(reverseSignalEvaluation.confidence_factors, classification.reasons)
            : classification.signalType === "CONSENSUS_DIVERGENCE" && consensusSignalEvaluation
              ? buildConsensusDivergenceConfidenceScore(consensusSignalEvaluation.confidence_factors, classification.reasons)
            : classification.signalType === "VOLATILITY_SPIKE" && volatilitySignalEvaluation
              ? buildVolatilitySpikeConfidenceScore(volatilitySignalEvaluation.confidence_factors, classification.reasons)
            : buildConfidenceScore(event, classification.reasons),
        evidence_chain: evidenceChain,
        explanation,
        risk_status: "INFORMATIONAL_ONLY",
        timestamp: createdAt,
        replay_reference: replayReference,
        recommendation_generated: false,
      });

      return {
        status: "SIGNAL_CREATED",
        reason: "Market movement detected. Verified source movement observed. Evidence chain attached. Risk status: informational only.",
        signal,
      };
    },
  };
}
