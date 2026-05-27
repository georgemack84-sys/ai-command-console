import type { EscalationCoordinationState, EscalationTelemetryEvent } from "./contracts/escalationTypes";

export function buildEscalationTelemetry(state: EscalationCoordinationState): EscalationTelemetryEvent[] {
  const events: EscalationTelemetryEvent[] = [
    {
      eventType: "escalation.lineage.recorded",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    },
    {
      eventType: "escalation.visibility.required",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    },
  ];

  if (state.blocked) {
    events.push({
      eventType: "escalation.blocked.insufficient_evidence",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  } else if (state.frozen) {
    events.push({
      eventType: "escalation.frozen",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  } else if (state.escalationState === "CONTAINED") {
    events.push({
      eventType: "escalation.contained",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  } else if (state.escalationState === "EMERGENCY") {
    events.push({
      eventType: "escalation.emergency.triggered",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  } else {
    events.push({
      eventType: "escalation.created",
      escalationId: state.escalationId,
      escalationLineageId: state.escalationLineageId,
      timestamp: state.timestamp,
    });
  }

  return events;
}
