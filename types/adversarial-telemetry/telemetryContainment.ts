export interface ContainmentPressureSignal {
  readonly signalId: string;
  readonly recursivePressure: number;
  readonly orchestrationPressure: number;
  readonly authorityExpansionPressure: number;
  readonly replayInstabilityPressure: number;
  readonly escalationSuppressionPressure: number;
  readonly containmentRiskScore: number;
  readonly escalationRequired: boolean;
  readonly freezeRecommended: boolean;
  readonly createdAt: string;
}
