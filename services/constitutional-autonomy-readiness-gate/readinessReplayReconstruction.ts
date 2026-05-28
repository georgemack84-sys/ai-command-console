import type { ConstitutionalReadinessCertification } from "@/types/constitutional-autonomy-readiness-gate";
import { normalizeReadinessValue } from "./readinessNormalizer";

export function reconstructReadinessReplay(
  certification: ConstitutionalReadinessCertification,
): ConstitutionalReadinessCertification {
  return Object.freeze(normalizeReadinessValue(certification));
}
