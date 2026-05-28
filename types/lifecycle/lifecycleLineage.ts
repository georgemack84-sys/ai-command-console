import type { BoundedIntentLifecycleState } from "./lifecycleState";

export type LifecycleLineageEntry = Readonly<{
  entryId: string;
  transitionId: string;
  proposalId: string;
  fromState: string;
  toState: BoundedIntentLifecycleState;
  replayHash: string;
  createdAt: string;
}>;

export type LifecycleLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly LifecycleLineageEntry[];
  lineageHash: string;
}>;

export type LifecycleAuditEvent = Readonly<{
  eventId: string;
  eventType: "lifecycle.transition.recorded" | "lifecycle.transition.rejected";
  proposalId: string;
  transitionId: string;
  lifecycleHash: string;
  createdAt: string;
  eventHash: string;
}>;
