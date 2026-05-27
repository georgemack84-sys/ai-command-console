export type ReplayContainmentSignal = Readonly<{
  replaySafe: boolean;
  errors: readonly string[];
  evidence: readonly string[];
}>;
