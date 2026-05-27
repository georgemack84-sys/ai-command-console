import type { ConstitutionalReadinessLevel } from "./readinessState";

export type ReadinessDashboardViews = Readonly<{
  observationView: readonly string[];
  recommendationView: readonly string[];
  approvalView: readonly string[];
  escalationView: readonly string[];
  replayView: readonly string[];
  overrideView: readonly string[];
  governanceView: readonly string[];
  confidenceView: readonly string[];
}>;

export type ConstitutionalReadinessCertification = Readonly<{
  certificationId: string;
  readinessLevel: ConstitutionalReadinessLevel;
  certified: boolean;
  score: number;
  rationale: readonly string[];
  dashboardViews: ReadinessDashboardViews;
  derivedOnly: true;
  createdAt: string;
}>;
