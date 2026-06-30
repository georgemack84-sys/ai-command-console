import { describe, expect, it } from "vitest";
import {
  assertGovernanceLineageExplorerActionBlocked,
  buildGovernanceLineageExplorerObservabilitySurface,
  buildGovernanceLineageExplorerView,
  getGovernanceLineageExplorerContract,
} from "@/services/governance-lineage-explorer";
import type { GovernanceLineageExplorerAction, GovernanceLineageExplorerState } from "@/types/governance-lineage-explorer";

describe("Mission Control Phase 7K.3 Governance Lineage Explorer", () => {
  it("defines read-only lineage explorer doctrine", () => {
    const contract = getGovernanceLineageExplorerContract();

    expect(contract.doctrine.schema_version).toBe("governance-lineage-explorer/v7K.3");
    expect(contract.doctrine.principles).toContain("replay-aware");
    expect(contract.doctrine.node_types).toContain("POLICY");
    expect(contract.doctrine.relationship_types).toContain("PARENT_OF");
    expect(contract.doctrine.prohibited_actions).toContain("CREATE_RELATIONSHIP");
  });

  it("builds a complete governance lineage explorer view", () => {
    const view = buildGovernanceLineageExplorerView();

    expect(view.schema_version).toBe("governance-lineage-explorer/v7K.3");
    expect(view.explorer_state).toBe("COMPLETE");
    expect(view.read_only).toBe(true);
    expect(view.advisory_only).toBe(true);
    expect(view.relationship_creation_allowed).toBe(false);
    expect(view.mutation_allowed).toBe(false);
    expect(view.lineage_verified).toBe(true);
    expect(view.replay_consistent).toBe(true);
  });

  it("renders certified graph nodes and edges deterministically", () => {
    const first = buildGovernanceLineageExplorerView();
    const second = buildGovernanceLineageExplorerView();

    expect(first.nodes.length).toBeGreaterThan(0);
    expect(first.edges.length).toBeGreaterThan(0);
    expect(second.explorer_hash).toBe(first.explorer_hash);
    expect(second.nodes.map((node) => node.node_id)).toEqual(first.nodes.map((node) => node.node_id));
    expect(second.edges.map((edge) => edge.edge_id)).toEqual(first.edges.map((edge) => edge.edge_id));
  });

  it("supports forward, backward, root, dependency, influence, and supersession navigation", () => {
    const view = buildGovernanceLineageExplorerView();

    expect(view.selected_node_id).toBeTruthy();
    expect(view.root_lineage.length).toBeGreaterThan(0);
    expect(view.dependency_chains.length).toBeGreaterThan(0);
    expect(view.influence_paths.length).toBeGreaterThan(0);
    expect(view.supersession_history.length).toBeGreaterThan(0);
    expect([...view.parent_chain, ...view.child_chain].length).toBeGreaterThan(0);
  });

  it("exposes evidence and replay references for audit investigations", () => {
    const view = buildGovernanceLineageExplorerView();

    expect(view.evidence_refs.length).toBeGreaterThan(0);
    expect(view.replay_refs.length).toBeGreaterThan(0);
    expect(view.graph_hash).toBeTruthy();
    expect(view.explorer_hash).toBeTruthy();
  });

  it.each(["PARTIAL", "BROKEN", "RESTRICTED"] as readonly GovernanceLineageExplorerState[])("surfaces %s lineage states without permitting mutation", (state) => {
    const view = buildGovernanceLineageExplorerView({ state });

    expect(view.explorer_state).toBe(state);
    expect(view.read_only).toBe(true);
    expect(view.relationship_creation_allowed).toBe(false);
    expect(view.lineage_verified).toBe(false);
  });

  it("keeps tenant, mission, operator, and selected artifact explicit", () => {
    const baseline = buildGovernanceLineageExplorerView();
    const selected = baseline.nodes.find((node) => node.node_type === "POLICY")?.node_id;
    const view = buildGovernanceLineageExplorerView({
      tenant_id: "tenant_custom",
      mission_id: "mission_custom",
      operator_id: "operator_custom",
      selected_node_id: selected,
    });

    expect(view.tenant_id).toBe("tenant_custom");
    expect(view.mission_id).toBe("mission_custom");
    expect(view.operator_id).toBe("operator_custom");
    expect(view.selected_node_id).toBe(selected);
    expect(view.tenant_isolated).toBe(true);
    expect(view.authorization_enforced).toBe(true);
  });

  it("exposes observability", () => {
    const surface = buildGovernanceLineageExplorerObservabilitySurface();

    expect(surface.explorer_state).toBe("COMPLETE");
    expect(surface.node_count).toBeGreaterThan(0);
    expect(surface.edge_count).toBeGreaterThan(0);
    expect(surface.lineage_verified).toBe(true);
    expect(surface.read_only).toBe(true);
    expect(surface.explorer_hash).toBeTruthy();
  });

  it.each([
    "MODIFY_LINEAGE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
    "ALTER_HISTORY",
    "OVERRIDE_GOVERNANCE",
    "REASSIGN_PARENT",
  ] as readonly GovernanceLineageExplorerAction[])("blocks prohibited lineage explorer action %s", (action) => {
    expect(() => assertGovernanceLineageExplorerActionBlocked(action)).toThrow("Governance Lineage Explorer is read-only");
  });
});
