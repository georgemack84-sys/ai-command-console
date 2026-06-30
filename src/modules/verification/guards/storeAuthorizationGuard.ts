import type { VerificationResult } from "../records/verificationResult";

export function authorizeVerifiedObservationForStore(
  result: VerificationResult | undefined,
): { status: "AUTHORIZED" } | { status: "DENIED"; reason: string } {
  if (!result) {
    return { status: "DENIED", reason: "unverified observation cannot append as valid" };
  }

  if (result.status !== "VERIFIED") {
    return { status: "DENIED", reason: `${result.status} observation cannot append as valid` };
  }

  return { status: "AUTHORIZED" };
}
