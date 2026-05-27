import type { SamDegradedMode } from "@/services/sam/scaling/samScalingTypes";

export function buildDegradedApiResponse({
  mode,
  reason,
  contractVersion,
}: {
  mode: SamDegradedMode;
  reason: string;
  contractVersion: string;
}) {
  return {
    ok: false as const,
    error: {
      code: "API_VALIDATION_FAILED",
      message: reason,
    },
    meta: {
      mode,
      contractVersion,
    },
  };
}
