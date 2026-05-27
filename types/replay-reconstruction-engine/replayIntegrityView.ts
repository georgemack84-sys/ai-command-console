export type ReplayIntegrityCheck = Readonly<{
  check: string;
  passed: boolean;
  expected?: string;
  actual?: string;
}>;

export type ReplayIntegrityView = Readonly<{
  valid: boolean;
  treatyIntegrityValid: boolean;
  eventIntegrityValid: boolean;
  lineageIntegrityValid: boolean;
  replayHashValid: boolean;
  checks: readonly ReplayIntegrityCheck[];
}>;
