export type BoundedIntentLifecycleState =
  | "observe"
  | "interpret"
  | "recommend"
  | "propose"
  | "review"
  | "approved"
  | "denied"
  | "revalidate"
  | "bounded_coordination"
  | "bounded_handoff"
  | "blocked"
  | "expired";
