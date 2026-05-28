import { describe, expect, it } from "vitest";

import { buildProposalLifecycleRecord } from "@/services/proposal-lifecycle-engine";
import { buildProposalFixture } from "./helpers";

describe("proposal lifecycle adversarial constraints", () => {
  it("denies hidden execution metadata and approval masquerading", () => {
    const { input } = buildProposalFixture({
      currentState: "governance_review",
      requestedTransition: "approve",
      metadata: Object.freeze({
        execute: true,
        approvalGranted: true,
      }),
    });
    const proposal = buildProposalLifecycleRecord(input);
    expect(proposal.errors.map((error) => error.code)).toContain("PROPOSAL_RUNTIME_BRIDGE_FORBIDDEN");
    expect(proposal.errors.map((error) => error.code)).toContain("PROPOSAL_AUTHORITY_INFLATION");
  });

  it("denies future-bound execution smuggling", () => {
    const { input } = buildProposalFixture({
      autonomyLevel: "A4",
      currentState: "governance_review",
      requestedTransition: "approve",
      actionId: "safe-action:simulate",
    });
    const proposal = buildProposalLifecycleRecord(input);
    expect(proposal.errors.map((error) => error.code)).toContain("PROPOSAL_FUTURE_BOUND_ESCALATION");
  });

  it("denies revoked proposals from continuing lifecycle transitions", () => {
    const { input } = buildProposalFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
      revocation: Object.freeze({
        revocationId: "revocation-001",
        status: "revoked",
        revokedAt: "2026-05-16T15:03:00.000Z",
        revokedBy: Object.freeze(["operator-09"]),
        reason: "operator revoked",
        replayLineageHash: "stale",
        immutable: true,
      }),
    });
    const proposal = buildProposalLifecycleRecord(input);
    expect(proposal.errors.map((error) => error.code)).toContain("PROPOSAL_REVOKED");
  });
});
