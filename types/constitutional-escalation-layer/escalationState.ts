import type { ConstitutionalEscalationRecommendation } from "./escalationRecommendation";
import type { ConstitutionalFreezeRecommendation } from "./escalationFreeze";

export type ConstitutionalEscalationState = Readonly<{
  stateId: string;
  activeRecommendation: ConstitutionalEscalationRecommendation;
  freezeRecommendation?: ConstitutionalFreezeRecommendation;
  uncertaintyOnlyIncreasesOversight: true;
  derivedOnly: true;
  createdAt: string;
}>;
