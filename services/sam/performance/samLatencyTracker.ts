import { recordSamDuration } from "./samPerformanceMetrics";
import type { SamDurationMetricName } from "./samPerformanceTypes";

type SamLatencyClock = {
  now?: () => number;
};

function getNow(clock?: SamLatencyClock) {
  return clock?.now || (() => Date.now());
}

export async function measureSamAsyncDuration<T>(
  name: SamDurationMetricName,
  fn: () => Promise<T>,
  clock?: SamLatencyClock,
): Promise<T> {
  const now = getNow(clock);
  const startedAt = now();
  try {
    return await fn();
  } finally {
    recordSamDuration(name, now() - startedAt);
  }
}

export function measureSamSyncDuration<T>(
  name: SamDurationMetricName,
  fn: () => T,
  clock?: SamLatencyClock,
): T {
  const now = getNow(clock);
  const startedAt = now();
  try {
    return fn();
  } finally {
    recordSamDuration(name, now() - startedAt);
  }
}
