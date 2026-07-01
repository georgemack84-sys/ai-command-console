import { describe, expect, it, vi } from "vitest";
import {
  assertGovernanceIntegrityViewerActionBlocked,
  buildGovernanceIntegrityViewerObservabilitySurface,
  buildGovernanceIntegrityViewerView,
  getGovernanceIntegrityViewerContract,
} from "@/services/governance-integrity-viewer";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceIntegrityViewerAction } from "@/types/governance-integrity-viewer";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7K.4 Governance Integrity Viewer", () => {
  it("defines read-only integrity viewer doctrine", () => {
    const contract = getGovernanceIntegrityViewerContract();

    expect(contract.doctrine.schema_version).toBe("governance-integrity-viewer/v7K.4");
    expect(contract.doctrine.principles).toContain("cryptographically-verifiable");
    expect(contract.doctrine.states).toEqual(["VALID", "DEGRADED", "CORRUPTED"]);
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.prohibited_actions).toContain("RECALCULATE_HASH");
  });

  it("builds a valid governance integrity viewer", () => {
    const view = buildGovernanceIntegrityViewerView();

    expect(view.schema_version).toBe("governance-integrity-viewer/v7K.4");
    expect(view.integrity_state).toBe("VALID");
    expect(view.certification_state).toBe("PASS");
    expect(view.read_only).toBe(true);
    expect(view.advisory_only).toBe(true);
    expect(view.hash_repair_allowed).toBe(false);
    expect(view.hash_recalculation_allowed).toBe(false);
    expect(view.verification_mutation_allowed).toBe(false);
    expect(view.mutation_allowed).toBe(false);
  });

  it("renders hash chain continuity and protected governance hashes", () => {
    const view = buildGovernanceIntegrityViewerView();

    expect(view.chain_id).toBeTruthy();
    expect(view.chain_continuity).toBe(true);
    expect(view.chain_completeness).toBe(true);
    expect(view.hashes.length).toBe(view.protected_record_count);
    expect(view.hashes.every((item) => item.hash_algorithm === "SHA-256")).toBe(true);
  });

  it("renders verification, tamper, timeline, trust, and certification sections", () => {
    const view = buildGovernanceIntegrityViewerView();

    expect(view.verification_results.length).toBeGreaterThan(0);
    expect(view.tamper_alerts.length).toBeGreaterThan(0);
    expect(view.timeline.map((event) => event.event_type)).toContain("CERTIFICATION_VALIDATION");
    expect(view.trust_indicators.governance_trust_level).toBe("TRUSTED");
    expect(view.certification_history.length).toBeGreaterThan(0);
  });

  it("keeps output deterministic", () => {
    const first = buildGovernanceIntegrityViewerView();
    const second = buildGovernanceIntegrityViewerView();

    expect(second.viewer_hash).toBe(first.viewer_hash);
    expect(second.hashes.map((item) => item.record_id)).toEqual(first.hashes.map((item) => item.record_id));
    expect(second.timeline.map((event) => event.event_id)).toEqual(first.timeline.map((event) => event.event_id));
  });

  it.each(["VALID", "DEGRADED", "CORRUPTED"] as readonly GovernanceIntegrityState[])("represents %s integrity state", (state) => {
    const view = buildGovernanceIntegrityViewerView({ state });

    expect(view.integrity_state).toBe(state);
    expect(view.read_only).toBe(true);
    expect(view.hash_repair_allowed).toBe(false);
    if (state === "CORRUPTED") {
      expect(view.certification_state).toBe("FAIL");
      expect(view.trust_indicators.governance_trust_level).toBe("BLOCKED");
      expect(view.corruption_indicators.length).toBeGreaterThan(0);
    }
  });

  it("keeps tenant, mission, operator, evidence, replay, and lineage scope explicit", () => {
    const view = buildGovernanceIntegrityViewerView({ tenant_id: "tenant_custom", mission_id: "mission_custom", operator_id: "operator_custom" });

    expect(view.tenant_id).toBe("tenant_custom");
    expect(view.mission_id).toBe("mission_custom");
    expect(view.operator_id).toBe("operator_custom");
    expect(view.tenant_isolated).toBe(true);
    expect(view.authorization_enforced).toBe(true);
    expect(view.evidence_refs.length).toBeGreaterThan(0);
    expect(view.replay_refs.length).toBeGreaterThan(0);
    expect(view.lineage_refs.length).toBeGreaterThan(0);
  });

  it("exposes observability", () => {
    const surface = buildGovernanceIntegrityViewerObservabilitySurface({ state: "CORRUPTED" });

    expect(surface.integrity_state).toBe("CORRUPTED");
    expect(surface.certification_state).toBe("FAIL");
    expect(surface.protected_record_count).toBeGreaterThan(0);
    expect(surface.tamper_alert_count).toBeGreaterThan(0);
    expect(surface.read_only).toBe(true);
    expect(surface.viewer_hash).toBeTruthy();
  });

  it.each([
    "REPAIR_INTEGRITY",
    "MODIFY_HASH",
    "RECALCULATE_HASH",
    "MODIFY_VERIFICATION",
    "ALTER_HISTORY",
    "OVERRIDE_GOVERNANCE",
  ] as readonly GovernanceIntegrityViewerAction[])("blocks prohibited integrity viewer action %s", (action) => {
    expect(() => assertGovernanceIntegrityViewerActionBlocked(action)).toThrow("Governance Integrity Viewer is read-only");
  });
});
