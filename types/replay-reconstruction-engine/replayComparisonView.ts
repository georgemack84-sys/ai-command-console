export type ReplayComparisonView = Readonly<{
  comparisonMode: "PLAN_TO_REPLAY" | "REPLAY_TO_REPLAY";
  comparisonHash: string;
  comparisonResult: "MATCH" | "DIFF_DETECTED" | "HASH_MISMATCH" | "UNSAFE_DRIFT" | "UNINSPECTABLE";
  changedPaths: readonly string[];
  warnings: readonly string[];
  errors: readonly string[];
}>;
