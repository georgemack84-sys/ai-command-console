import { evaluateConsensusDivergenceSignal } from "./consensusDivergenceSignal";
import type { SignalClassifierResult, VerifiedMovementEvent } from "./types";
import { evaluateReverseLineMovementSignal } from "./reverseLineMovementSignal";
import { evaluateSteamMovementSignal } from "./steamMovementSignal";
import { evaluateVolatilitySpikeSignal } from "./volatilitySpikeSignal";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function classifySignal(event: VerifiedMovementEvent): SignalClassifierResult {
  const payload = event.payload;

  const reverseLineEvaluation = evaluateReverseLineMovementSignal(event);
  if (reverseLineEvaluation.status === "SIGNAL") {
    return { status: "SIGNAL", signalType: "REVERSE_LINE_MOVEMENT", reasons: reverseLineEvaluation.reasons };
  }
  if (payload.reverse_line_movement === true) {
    return { status: "SIGNAL", signalType: "REVERSE_LINE_MOVEMENT", reasons: ["Reverse line movement flag detected."] };
  }
  const consensusDivergenceEvaluation = evaluateConsensusDivergenceSignal(event);
  if (consensusDivergenceEvaluation.status === "SIGNAL") {
    return { status: "SIGNAL", signalType: "CONSENSUS_DIVERGENCE", reasons: consensusDivergenceEvaluation.reasons };
  }
  if (payload.consensus_divergence === true) {
    return { status: "SIGNAL", signalType: "CONSENSUS_DIVERGENCE", reasons: ["Consensus divergence evidence detected."] };
  }
  const volatilityEvaluation = evaluateVolatilitySpikeSignal(event);
  if (volatilityEvaluation.status === "SIGNAL") {
    return { status: "SIGNAL", signalType: "VOLATILITY_SPIKE", reasons: volatilityEvaluation.reasons };
  }
  if (payload.volatility_state === "VOLATILE" || payload.velocity_state === "VOLATILE") {
    return { status: "SIGNAL", signalType: "VOLATILITY_SPIKE", reasons: ["Volatility spike detected from verified movement evidence."] };
  }
  if (event.event_type === "odds_shift_event" && isNumber(payload.implied_probability_delta) && payload.implied_probability_delta !== 0) {
    return { status: "SIGNAL", signalType: "IMPLIED_PROBABILITY_SHIFT", reasons: ["Implied probability shift detected."] };
  }
  const steamEvaluation = evaluateSteamMovementSignal(event);
  if (steamEvaluation.status === "SIGNAL") {
    return { status: "SIGNAL", signalType: "STEAM_MOVEMENT", reasons: steamEvaluation.reasons };
  }
  if (payload.force_unclassified === true) {
    return { status: "NO_SIGNAL", signalType: "UNCLASSIFIED", reasons: ["Event explicitly marked as unclassified."] };
  }

  return {
    status: "NO_SIGNAL",
    signalType: "UNCLASSIFIED",
    reasons: ["No eligible informational signal type applied."],
  };
}
