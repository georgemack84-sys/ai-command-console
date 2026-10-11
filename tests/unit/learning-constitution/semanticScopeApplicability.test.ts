import { describe, expect, it } from "vitest";

import {
  evaluateSemanticScopeApplicability,
  evaluateSemanticScopeContainment,
  isValidSemanticScopeReference,
  proposeSemanticScopeWidening,
  type SemanticScopeReference,
} from "@/types/learning-constitution";

const organization: SemanticScopeReference = {
  identity: { dimension: "ORGANIZATION", identifier: "org-1" },
};
const workspace: SemanticScopeReference = {
  identity: { dimension: "WORKSPACE", identifier: "workspace-1" },
  parent: organization,
};
const project: SemanticScopeReference = {
  identity: { dimension: "PROJECT", identifier: "project-1" },
  parent: workspace,
};

describe("semantic scope identity, parentage, and containment", () => {
  it("requires an identifier for every non-system canonical dimension", () => {
    expect(isValidSemanticScopeReference(project)).toBe(true);
    expect(
      isValidSemanticScopeReference({
        identity: { dimension: "PROJECT", identifier: "" },
      }),
    ).toBe(false);
    expect(
      isValidSemanticScopeReference({ identity: { dimension: "SYSTEM" } }),
    ).toBe(true);
    expect(
      isValidSemanticScopeReference({
        identity: { dimension: "SYSTEM", identifier: "root" },
      }),
    ).toBe(false);
  });

  it("applies only to an exact identity or explicitly declared ancestor", () => {
    expect(evaluateSemanticScopeContainment(project, project)).toMatchObject({
      outcome: "APPLIES",
      reason: "EXACT_IDENTITY",
    });
    expect(evaluateSemanticScopeContainment(project, workspace)).toMatchObject({
      outcome: "APPLIES",
      reason: "EXPLICIT_PARENT_CHAIN",
    });
    expect(
      evaluateSemanticScopeContainment(project, organization),
    ).toMatchObject({
      outcome: "APPLIES",
      reason: "EXPLICIT_PARENT_CHAIN",
    });
  });

  it("does not infer cross-project or system-wide applicability", () => {
    expect(
      evaluateSemanticScopeContainment(project, {
        identity: { dimension: "PROJECT", identifier: "project-2" },
      }),
    ).toMatchObject({
      outcome: "DOES_NOT_APPLY",
      reason: "DISTINCT_IDENTITIES",
    });
    expect(
      evaluateSemanticScopeContainment(project, {
        identity: { dimension: "SYSTEM" },
      }),
    ).toMatchObject({
      outcome: "DOES_NOT_APPLY",
      reason: "DISTINCT_IDENTITIES",
    });
  });

  it("inherits only into an explicitly nested context and keeps lateral scopes isolated", () => {
    expect(
      evaluateSemanticScopeApplicability(workspace, project),
    ).toMatchObject({
      outcome: "APPLIES",
      reason: "EXPLICIT_INHERITANCE",
    });
    expect(
      evaluateSemanticScopeApplicability(project, {
        identity: { dimension: "PROJECT", identifier: "project-2" },
        parent: workspace,
      }),
    ).toMatchObject({
      outcome: "DOES_NOT_APPLY",
      reason: "DISTINCT_IDENTITIES",
    });
  });

  it("requires an explicit governance proposal before applicability can widen", () => {
    expect(
      evaluateSemanticScopeApplicability(project, workspace),
    ).toMatchObject({
      outcome: "REQUIRES_REVIEW",
      reason: "WIDENING_PROPOSAL_REQUIRED",
    });

    expect(
      proposeSemanticScopeWidening({
        proposalId: "scope-widening-1",
        sourceScope: project,
        targetScope: workspace,
        rationale:
          "A reviewer may later assess whether this project knowledge applies workspace-wide.",
      }),
    ).toEqual({
      outcome: "PROPOSED",
      reason: "EXPLICIT_ANCESTOR_TARGET",
      proposal: {
        proposalId: "scope-widening-1",
        sourceScope: project,
        targetScope: workspace,
        rationale:
          "A reviewer may later assess whether this project knowledge applies workspace-wide.",
        status: "PROPOSED",
        persistenceEffect: "NONE",
        authorityEffect: "UNCHANGED",
        executionPermissionGranted: false,
      },
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });

  it("rejects a proposal that is not a widening operation", () => {
    expect(
      proposeSemanticScopeWidening({
        proposalId: "scope-widening-2",
        sourceScope: workspace,
        targetScope: project,
        rationale: "This is narrowing, not widening.",
      }),
    ).toMatchObject({ outcome: "REJECTED", reason: "TARGET_IS_NOT_WIDER" });
  });

  it("requires review for malformed parentage and has no authority effect", () => {
    const malformed = {
      identity: { dimension: "PROJECT", identifier: "project-1" },
      parent: { identity: { dimension: "SYSTEM" }, parent: project },
    } as SemanticScopeReference;

    expect(evaluateSemanticScopeContainment(malformed, organization)).toEqual({
      outcome: "REQUIRES_REVIEW",
      reason: "INVALID_SCOPE_REFERENCE",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });

  it("identifies a parentage cycle without attempting to repair it", () => {
    const cyclic = {
      identity: { dimension: "PROJECT", identifier: "project-1" },
    } as SemanticScopeReference;
    (cyclic as { parent?: SemanticScopeReference }).parent = cyclic;

    expect(
      evaluateSemanticScopeContainment(cyclic, organization),
    ).toMatchObject({
      outcome: "REQUIRES_REVIEW",
      reason: "PARENTAGE_CYCLE",
    });
  });
});
