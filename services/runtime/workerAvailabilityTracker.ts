export function trackWorkerAvailability({
  activeLocks = 0,
  staleLocks = 0,
  activeAttempts = 0,
  stalledAttempts = 0,
}: {
  activeLocks?: number;
  staleLocks?: number;
  activeAttempts?: number;
  stalledAttempts?: number;
}) {
  if (activeLocks <= 0 && activeAttempts <= 0) {
    return {
      score: 1,
      stalled: false,
    };
  }

  const lockPenalty = activeLocks > 0 ? staleLocks / Math.max(1, activeLocks) : 0;
  const attemptPenalty = activeAttempts > 0 ? stalledAttempts / Math.max(1, activeAttempts) : 0;
  const score = Math.max(0, 1 - Math.min(1, lockPenalty * 0.7 + attemptPenalty * 0.5));

  return {
    score,
    stalled: staleLocks > 0 || stalledAttempts > 0,
  };
}
