import {
  blockedAutomationLanguage,
  blockedGuaranteeLanguage,
  blockedMisleadingConfidenceLanguage,
  blockedPickLanguage,
  includesBlockedPhrase,
  prohibitedResponsibleGamblingFields,
} from "../language/blockedLanguage";
import { blockedBankrollEscalationLanguage } from "../language/bankrollSafetyLanguage";
import { applyResponsibleGamblingDisclaimer } from "../language/disclaimerFramework";
import type { GamblingOutputStatus, ResponsibleGamblingGuardrailDecision } from "../records/responsibleGamblingGuardrailDecision";
import { createResponsibleGamblingEvent, type ResponsibleGamblingEvent } from "../events/responsibleGamblingEvents";

function decisionIdFor(output: string, version: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < output.length; index += 1) {
    hash ^= output.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `rg_decision_${(hash >>> 0).toString(16)}_${version}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function blockedDecision(input: {
  requestedOutput: string;
  status: GamblingOutputStatus;
  reason: string;
  eventType: ResponsibleGamblingEvent["event_type"];
  version: string;
}) {
  const decision_id = decisionIdFor(input.requestedOutput, input.version);
  const decision: ResponsibleGamblingGuardrailDecision = {
    decision_id,
    requested_output: input.requestedOutput,
    status: input.status,
    blocked_reason: input.reason,
    disclaimer_applied: false,
    timestamp: new Date(0).toISOString(),
    version: input.version,
  };

  return {
    decision,
    events: [
      createResponsibleGamblingEvent({ decision_id, event_type: "GUARDRAIL_CHECK_STARTED", reason: "Guardrail check started.", version: input.version }),
      createResponsibleGamblingEvent({ decision_id, event_type: input.eventType, reason: input.reason, severity: "WARN", version: input.version }),
    ],
  };
}

export function classifyGamblingOutput(input: {
  requested_output: string;
  output_fields?: Record<string, unknown>;
  disclaimer_level?: "required" | "short";
  version?: string;
}): { decision: ResponsibleGamblingGuardrailDecision; events: ResponsibleGamblingEvent[] } {
  const version = input.version ?? "1.7";
  const requestedOutput = input.requested_output;

  for (const field of prohibitedResponsibleGamblingFields) {
    if (input.output_fields && Object.prototype.hasOwnProperty.call(input.output_fields, field)) {
      return blockedDecision({
        requestedOutput,
        status: "BLOCKED_PREMATURE_RECOMMENDATION",
        reason: `${field} field is prohibited in informational-only mode.`,
        eventType: "PREMATURE_RECOMMENDATION_BLOCKED",
        version,
      });
    }
  }

  const pickPhrase = includesBlockedPhrase(requestedOutput, blockedPickLanguage);
  if (pickPhrase) {
    return blockedDecision({ requestedOutput, status: "BLOCKED_PICK", reason: `${pickPhrase} is prohibited.`, eventType: "PICK_LANGUAGE_BLOCKED", version });
  }

  const guaranteePhrase = includesBlockedPhrase(requestedOutput, blockedGuaranteeLanguage);
  if (guaranteePhrase) {
    return blockedDecision({ requestedOutput, status: "BLOCKED_GUARANTEE", reason: `${guaranteePhrase} is prohibited.`, eventType: "GUARANTEE_LANGUAGE_BLOCKED", version });
  }

  const automationPhrase = includesBlockedPhrase(requestedOutput, blockedAutomationLanguage);
  if (automationPhrase) {
    return blockedDecision({ requestedOutput, status: "BLOCKED_AUTOMATION", reason: `${automationPhrase} is prohibited.`, eventType: "BET_AUTOMATION_BLOCKED", version });
  }

  const chasingPhrase = includesBlockedPhrase(requestedOutput, blockedBankrollEscalationLanguage);
  if (chasingPhrase) {
    return blockedDecision({ requestedOutput, status: "BLOCKED_CHASING_LOSSES", reason: `${chasingPhrase} is prohibited.`, eventType: "CHASING_LOSSES_BLOCKED", version });
  }

  const confidencePhrase = includesBlockedPhrase(requestedOutput, blockedMisleadingConfidenceLanguage);
  if (confidencePhrase) {
    return blockedDecision({ requestedOutput, status: "BLOCKED_MISLEADING_CONFIDENCE", reason: `${confidencePhrase} is prohibited.`, eventType: "MISLEADING_CONFIDENCE_BLOCKED", version });
  }

  const decision_id = decisionIdFor(requestedOutput, version);
  const allowedOutput = applyResponsibleGamblingDisclaimer(requestedOutput, input.disclaimer_level ?? "required");
  return {
    decision: {
      decision_id,
      requested_output: requestedOutput,
      status: "ALLOWED_INFORMATIONAL",
      allowed_output: allowedOutput,
      disclaimer_applied: true,
      timestamp: new Date(0).toISOString(),
      version,
    },
    events: [
      createResponsibleGamblingEvent({ decision_id, event_type: "GUARDRAIL_CHECK_STARTED", reason: "Guardrail check started.", version }),
      createResponsibleGamblingEvent({ decision_id, event_type: "INFORMATIONAL_OUTPUT_ALLOWED", reason: "Informational output allowed.", version }),
      createResponsibleGamblingEvent({ decision_id, event_type: "DISCLAIMER_APPLIED", reason: "Disclaimer applied.", version }),
    ],
  };
}
