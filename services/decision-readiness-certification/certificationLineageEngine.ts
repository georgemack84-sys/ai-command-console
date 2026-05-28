import { hashCertificationValue } from "./certificationHashEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessCertificationLineageEntry,
} from "./types/decisionReadinessCertificationTypes";

export function buildCertificationLineageEntry(
  input: DecisionReadinessCertificationInput,
  certified: boolean,
): DecisionReadinessCertificationLineageEntry {
  return Object.freeze({
    entryId: hashCertificationValue("decision-readiness-lineage-entry-id", {
      certificationId: input.certificationId,
      certifiedAt: input.certifiedAt,
    }),
    certificationId: input.certificationId,
    recommendationSystemId: input.recommendationSystemId,
    certified,
    certifiedAt: input.certifiedAt,
    deterministicHash: hashCertificationValue("decision-readiness-lineage-entry", {
      certificationId: input.certificationId,
      recommendationSystemId: input.recommendationSystemId,
      certified,
    }),
  });
}
