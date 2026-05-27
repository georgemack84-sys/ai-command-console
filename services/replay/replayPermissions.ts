export const REPLAY_ACTION_PERMISSIONS = {
  replay: "recovery:replay",
  rollback: "recovery:rollback",
  reassign: "recovery:reassign",
  terminate: "recovery:terminate",
  quarantine: "recovery:quarantine",
  override: "recovery:override",
} as const;

export type ReplayGovernedAction = keyof typeof REPLAY_ACTION_PERMISSIONS;
