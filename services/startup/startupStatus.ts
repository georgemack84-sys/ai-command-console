type FrozenStartupStatus =
  | null
  | {
      ready: boolean;
      checkedAt: string;
      summary: string;
    };

let frozenStatus: FrozenStartupStatus = null;

export function freezeStartupStatus(status: NonNullable<FrozenStartupStatus>) {
  if (!frozenStatus) {
    frozenStatus = status;
  }
  return frozenStatus;
}

export function getFrozenStartupStatus() {
  return frozenStatus;
}

export function resetStartupStatusForTests() {
  frozenStatus = null;
}
