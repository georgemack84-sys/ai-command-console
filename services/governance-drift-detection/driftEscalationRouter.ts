import { hashGovernanceDriftValue } from "./deterministicDriftHasher";

export function routeGovernanceDriftEscalation(input: {
  driftId: string;
  errors: readonly string[];
}) {
  const escalationRequired = input.errors.length > 0;
  const governanceReviewRequired = escalationRequired;
  const freezeRequired = escalationRequired;
  return Object.freeze({
    escalationRequired,
    governanceReviewRequired,
    freezeRequired,
    escalationHash: hashGovernanceDriftValue("drift-escalation", input),
  });
}
