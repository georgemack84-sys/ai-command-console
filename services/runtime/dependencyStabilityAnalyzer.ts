export function analyzeDependencyStability({
  startupReady,
  startupSummary,
  degradedDependencies = [],
  criticalFailures = 0,
}: {
  startupReady: boolean | null;
  startupSummary?: string | null;
  degradedDependencies?: string[];
  criticalFailures?: number;
}) {
  const summary = String(startupSummary || "").toLowerCase();
  const derived = [...degradedDependencies];

  if (startupReady === false && !derived.includes("startup_governance")) {
    derived.push("startup_governance");
  }
  if (summary.includes("database") && !derived.includes("database")) {
    derived.push("database");
  }
  if (summary.includes("observability") && !derived.includes("observability")) {
    derived.push("observability");
  }

  let score = startupReady === true ? 1 : startupReady === false ? 0.25 : 0.5;
  score -= Math.min(0.5, derived.length * 0.1);
  score -= Math.min(0.25, Number(criticalFailures || 0) * 0.08);

  return {
    score: Math.max(0, Math.min(1, score)),
    degradedDependencies: Array.from(new Set(derived)).sort((left, right) => left.localeCompare(right)),
  };
}
