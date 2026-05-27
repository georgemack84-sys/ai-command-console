export type AmbiguityFinding = {
  code: string;
  message: string;
  severity: "warning" | "error" | "critical";
  clarificationRequired: boolean;
};
