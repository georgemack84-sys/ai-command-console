export type StateTransitionView = Readonly<{
  previousState: string;
  nextState: string;
  transitionReason: string;
  validatorSource?: string;
  governanceSource?: string;
  evidenceHash: string;
}>;

export type StateProjection = Readonly<{
  reconstructedStateHash: string;
  currentStatus: string;
  transitions: readonly StateTransitionView[];
  projectionHash: string;
}>;
