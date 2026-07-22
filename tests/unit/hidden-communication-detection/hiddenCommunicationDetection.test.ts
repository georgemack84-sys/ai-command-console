import { describe, expect, it } from "vitest";
import {
  buildHiddenCommunicationAnalysis,
  buildHiddenCommunicationObservabilitySurface,
  detectHiddenCommunication,
  detectSideChannel,
  getHiddenCommunicationDetection,
  registerMessage,
  validateChannel,
  validateHiddenCommunication,
  validatePermission,
  verifyMessageLineage,
} from "@/services/hidden-communication-detection";
import type { HiddenCommunicationFailure, HiddenCommunicationScenario } from "@/types/hidden-communication-detection";

describe("hidden communication detection", () => {
  it("publishes the 8ALT.7.10 certified doctrine bundle", () => {
    const bundle = getHiddenCommunicationDetection();

    expect(bundle.doctrine.contract_version).toBe("hidden-communication-detection/v8ALT.7.10");
    expect(bundle.doctrine.final_state).toBe("HIDDEN_COMMUNICATION_DETECTION_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.analysis.state).toBe("CERTIFIED");
  });

  it("validates approved channels, permissions, logging, lineage, and replay in baseline", () => {
    const analysis = buildHiddenCommunicationAnalysis();
    const validation = validateHiddenCommunication(analysis);

    expect(validateChannel().channels_valid).toBe(true);
    expect(validatePermission().permissions_valid).toBe(true);
    expect(registerMessage()).toHaveLength(1);
    expect(verifyMessageLineage().hidden_edges_detected).toBe(false);
    expect(validation.replay_reproducible).toBe(true);
  });

  it("enforces governance visibility, tenant isolation, integrity, audit immutability, and operator visibility", () => {
    const validation = validateHiddenCommunication();

    expect(validation.governance_visibility_complete).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(validation.integrity_valid).toBe(true);
    expect(validation.audit_trail_immutable).toBe(true);
    expect(validation.operator_visible).toBe(true);
  });

  it.each([
    ["UNAPPROVED_CHANNEL", "UNAPPROVED_CHANNEL_DETECTED"],
    ["UNLOGGED_MESSAGE", "UNLOGGED_MESSAGE_DETECTED"],
    ["HIDDEN_GOVERNANCE_COMMUNICATION", "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED"],
    ["MISSING_REPLAY_CAPTURE", "MISSING_REPLAY_CAPTURE_DETECTED"],
    ["CROSS_TENANT_COMMUNICATION", "CROSS_TENANT_COMMUNICATION_DETECTED"],
    ["UNAUTHORIZED_EXCHANGE", "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED"],
    ["HIDDEN_COMMUNICATION", "HIDDEN_COMMUNICATION_DETECTED"],
    ["SIDE_CHANNEL_SIGNALING", "SIDE_CHANNEL_SIGNALING_DETECTED"],
    ["UNREGISTERED_MESSAGE", "UNREGISTERED_MESSAGE_DETECTED"],
    ["MISSING_COMMUNICATION_EVIDENCE", "MISSING_COMMUNICATION_EVIDENCE_DETECTED"],
    ["HIDDEN_LINEAGE_EDGE", "HIDDEN_LINEAGE_EDGE_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["OPERATOR_VISIBILITY_INCOMPLETE", "OPERATOR_VISIBILITY_INCOMPLETE"],
  ] satisfies [HiddenCommunicationScenario, HiddenCommunicationFailure][])("fails closed for %s", (scenario, failure) => {
    const validation = validateHiddenCommunication(buildHiddenCommunicationAnalysis({ scenario }));

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("detects hidden communication and side-channel alerts", () => {
    expect(detectHiddenCommunication({ scenario: "HIDDEN_COMMUNICATION" })[0].failure).toBe("HIDDEN_COMMUNICATION_DETECTED");
    expect(detectSideChannel({ scenario: "SIDE_CHANNEL_SIGNALING" })[0].failure).toBe("SIDE_CHANNEL_SIGNALING_DETECTED");
  });

  it("publishes communication observability", () => {
    const surface = buildHiddenCommunicationObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.channel_count).toBe(7);
    expect(surface.message_count).toBe(1);
    expect(surface.alert_count).toBe(0);
    expect(surface.contract_hash).toBeTruthy();
  });
});
