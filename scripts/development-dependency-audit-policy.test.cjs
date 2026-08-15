const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  validateDevelopmentAudit,
} = require("./development-dependency-audit-policy.cjs");

const report = {
  vulnerabilities: {
    esbuild: {
      via: [
        {
          severity: "low",
          url: "https://github.com/advisories/GHSA-example",
        },
      ],
    },
    tsx: { via: ["esbuild"] },
  },
};
const register = {
  exceptions: [
    {
      id: "DEV-001",
      graphs: ["root"],
      affectedPackages: ["esbuild", "tsx"],
      advisoryUrls: ["https://github.com/advisories/GHSA-example"],
      maximumSeverity: "low",
      owner: "Platform",
      expiresOn: "2026-09-30",
      exposure: "Development only.",
      mitigation: "Keep the server private.",
    },
  ],
};

test("accepts a current exact advisory exception", () => {
  assert.deepEqual(
    validateDevelopmentAudit({
      report,
      graph: "root",
      register,
      today: "2026-08-15",
    }),
    [],
  );
});

test("rejects an unapproved advisory", () => {
  const errors = validateDevelopmentAudit({
    report,
    graph: "web",
    register,
    today: "2026-08-15",
  });
  assert.ok(errors.some((error) => error.includes("unapproved advisory")));
});

test("rejects expired and stale exceptions", () => {
  const errors = validateDevelopmentAudit({
    report: { vulnerabilities: {} },
    graph: "root",
    register: {
      exceptions: [{ ...register.exceptions[0], expiresOn: "2026-08-14" }],
    },
    today: "2026-08-15",
  });
  assert.ok(errors.some((error) => error.includes("expired")));
  assert.ok(errors.some((error) => error.includes("stale")));
});

test("rejects severity growth beyond the approval", () => {
  const escalated = structuredClone(report);
  escalated.vulnerabilities.esbuild.via[0].severity = "high";
  const errors = validateDevelopmentAudit({
    report: escalated,
    graph: "root",
    register,
    today: "2026-08-15",
  });
  assert.ok(errors.some((error) => error.includes("permits low")));
});
