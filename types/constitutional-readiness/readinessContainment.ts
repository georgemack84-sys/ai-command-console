export type ContainmentReadinessRecord = Readonly<{
  readinessId: string;
  containmentPressureScore: number;
  freezeRecommended: boolean;
  containmentGuaranteed: boolean;
  verificationHash: string;
}>;
