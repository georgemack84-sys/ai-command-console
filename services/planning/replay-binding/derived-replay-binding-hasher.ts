import { hashStableContent } from "../versioning";
import type {
  ImmutableReplayBinding,
  ReplayBindingContext,
  ReplayCertification,
  ReplayRevocation,
} from "./replay-binding-types";

export function deriveReplayBindingHash(input: {
  context: ReplayBindingContext;
  binding: ImmutableReplayBinding;
  certification: ReplayCertification;
  revocation?: ReplayRevocation;
}): string {
  return hashStableContent("REPLAY_CONTEXT", {
    phase: "4.2M",
    context: input.context,
    binding: input.binding,
    certification: input.certification,
    ...(input.revocation ? { revocation: input.revocation } : {}),
  });
}
