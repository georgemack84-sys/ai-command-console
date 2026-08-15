const severityOrder = new Map([
  ["info", 0],
  ["low", 1],
  ["moderate", 2],
  ["high", 3],
  ["critical", 4],
]);

function advisoriesFor(report, packageName, seen = new Set()) {
  if (seen.has(packageName)) return [];
  seen.add(packageName);
  const entry = report.vulnerabilities?.[packageName];
  if (!entry) return [];
  return (entry.via ?? []).flatMap((via) => {
    if (typeof via === "string") return advisoriesFor(report, via, seen);
    return via?.url ? [via] : [];
  });
}

function validateException(exception, today) {
  const errors = [];
  for (const field of ["id", "owner", "expiresOn", "exposure", "mitigation"]) {
    if (typeof exception[field] !== "string" || exception[field].trim() === "")
      errors.push(`dependency exception is missing ${field}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.expiresOn ?? ""))
    errors.push(
      `${exception.id ?? "dependency exception"} has an invalid expiry`,
    );
  else if (exception.expiresOn < today)
    errors.push(`${exception.id} expired on ${exception.expiresOn}`);
  if (!Array.isArray(exception.graphs) || exception.graphs.length === 0)
    errors.push(`${exception.id ?? "dependency exception"} must name a graph`);
  if (
    !Array.isArray(exception.affectedPackages) ||
    exception.affectedPackages.length === 0
  )
    errors.push(
      `${exception.id ?? "dependency exception"} must name affected packages`,
    );
  if (
    !Array.isArray(exception.advisoryUrls) ||
    exception.advisoryUrls.length === 0
  )
    errors.push(
      `${exception.id ?? "dependency exception"} must name advisory URLs`,
    );
  if (!severityOrder.has(exception.maximumSeverity))
    errors.push(
      `${exception.id ?? "dependency exception"} has an invalid maximumSeverity`,
    );
  return errors;
}

function validateDevelopmentAudit({ report, graph, register, today }) {
  const errors = [];
  const exceptions = register.exceptions ?? [];
  for (const exception of exceptions)
    errors.push(...validateException(exception, today));

  const matched = new Set();
  for (const packageName of Object.keys(report.vulnerabilities ?? {})) {
    const advisories = advisoriesFor(report, packageName);
    if (advisories.length === 0) {
      errors.push(
        `${graph}:${packageName} has an unresolved vulnerability chain`,
      );
      continue;
    }
    for (const advisory of advisories) {
      const exception = exceptions.find(
        (candidate) =>
          candidate.graphs?.includes(graph) &&
          candidate.affectedPackages?.includes(packageName) &&
          candidate.advisoryUrls?.includes(advisory.url),
      );
      if (!exception) {
        errors.push(
          `${graph}:${packageName} has unapproved advisory ${advisory.url}`,
        );
        continue;
      }
      matched.add(`${exception.id}:${advisory.url}`);
      if (
        severityOrder.get(advisory.severity) >
        severityOrder.get(exception.maximumSeverity)
      ) {
        errors.push(
          `${exception.id} permits ${exception.maximumSeverity}, but ${advisory.url} is ${advisory.severity}`,
        );
      }
    }
  }

  for (const exception of exceptions.filter((item) =>
    item.graphs?.includes(graph),
  )) {
    for (const advisoryUrl of exception.advisoryUrls ?? []) {
      if (!matched.has(`${exception.id}:${advisoryUrl}`))
        errors.push(
          `${exception.id} is stale for ${graph}: ${advisoryUrl} was not reported`,
        );
    }
  }
  return errors;
}

module.exports = { validateDevelopmentAudit };
