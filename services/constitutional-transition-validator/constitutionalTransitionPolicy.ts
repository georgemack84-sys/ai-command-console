import type { ConstitutionalTransition } from "./types/constitutionalTransitionTypes";

type TransitionPolicy = Readonly<Record<ConstitutionalTransition["entityType"], Readonly<Record<string, readonly string[]>>>>;

export const CONSTITUTIONAL_TRANSITION_POLICY: TransitionPolicy = Object.freeze({
  recommendation: Object.freeze({
    observed: Object.freeze(["validated", "blocked", "escalated", "frozen"]),
    validated: Object.freeze(["blocked", "escalated", "audited", "frozen"]),
    blocked: Object.freeze(["frozen", "audited"]),
    escalated: Object.freeze(["frozen", "audited"]),
    audited: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
  proposal: Object.freeze({
    drafted: Object.freeze(["validated", "frozen", "rejected"]),
    validated: Object.freeze(["sealed", "frozen", "rejected", "revoked"]),
    sealed: Object.freeze(["replay_verified", "frozen", "revoked", "superseded"]),
    replay_verified: Object.freeze(["frozen", "revoked", "superseded"]),
    rejected: Object.freeze([]),
    revoked: Object.freeze([]),
    superseded: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
  escalation: Object.freeze({
    pending: Object.freeze(["escalated", "frozen", "rejected"]),
    escalated: Object.freeze(["audited", "frozen"]),
    rejected: Object.freeze([]),
    audited: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
  governance: Object.freeze({
    snapshotted: Object.freeze(["validated", "frozen"]),
    validated: Object.freeze(["audited", "frozen"]),
    audited: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
  approval: Object.freeze({
    requested: Object.freeze(["validated", "rejected", "frozen"]),
    validated: Object.freeze(["audited", "revoked", "frozen"]),
    rejected: Object.freeze([]),
    revoked: Object.freeze([]),
    audited: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
  simulation: Object.freeze({
    drafted: Object.freeze(["validated", "rejected", "frozen"]),
    validated: Object.freeze(["audited", "frozen"]),
    rejected: Object.freeze([]),
    audited: Object.freeze([]),
    frozen: Object.freeze([]),
  }),
});
