export type AuthorityLevel = "A0" | "A1" | "A2" | "A3" | "A4" | "A5";

export type ActionState =
  | "DRAFTED"
  | "AWAITING_CONFIRMATION"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "UNCERTAIN"
  | "ROLLED_BACK"
  | "CANCELLED";
