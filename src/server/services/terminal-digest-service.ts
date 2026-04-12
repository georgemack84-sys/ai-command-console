import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";
import { formatTerminalTrustReport } from "@/src/server/services/terminal-collaboration-read-service";

const require = createRequire(import.meta.url);

const { getDigestPreferences, recordDigestRun } = require("../../../services/collaboration");
const { appendAuditEvent } = require("../../../services/auditTrail");

type DigestActor = Pick<SessionUser, "id" | "name" | "email" | "workspaceId">;

type TerminalOverviewLike = {
  collaboration?: {
    inbox?: Array<Record<string, unknown>>;
    notificationDigest?: Record<string, unknown>;
    digestPreferences?: Record<string, unknown>;
    approvalTrustSignals?: Array<Record<string, unknown>>;
    completedTrustIncidents?: Array<Record<string, unknown>>;
    environmentTrustRecaps?: Array<Record<string, unknown>>;
  };
};

export function createTerminalDigest(actor: DigestActor, overview: TerminalOverviewLike) {
  const collaboration = overview.collaboration || {};
  const preferences = {
    ...getDigestPreferences(actor.id),
    ...(collaboration.digestPreferences || {}),
  };
  const digestStats = (collaboration.notificationDigest || {}) as Record<string, unknown>;
  const inbox = Array.isArray(collaboration.inbox) ? collaboration.inbox : [];
  const trustSignals = Array.isArray(collaboration.approvalTrustSignals) ? collaboration.approvalTrustSignals : [];
  const completedTrustIncidents = Array.isArray(collaboration.completedTrustIncidents)
    ? collaboration.completedTrustIncidents
    : [];
  const environmentTrustRecaps = Array.isArray(collaboration.environmentTrustRecaps)
    ? collaboration.environmentTrustRecaps
    : [];
  const trustReportRequested = Boolean(preferences.includeTrustReport);

  const highlights = [
    ...inbox.slice(0, 5).map((item) => String(item.title || "")),
    ...(trustReportRequested
      ? environmentTrustRecaps
          .slice(0, 2)
          .map(
            (item) =>
              `Env ${String(item.environment || "unknown")}: score ${String(item.score ?? 0)} • active ${String(item.activeSignals ?? 0)} • archived ${String(item.completedArchived ?? 0)}`,
          )
      : []),
    ...(trustReportRequested ? trustSignals.slice(0, 2).map((item) => `Trust: ${String(item.title || "")}`) : []),
    ...(trustReportRequested
      ? completedTrustIncidents.slice(0, 2).map((item) => `Trust complete: ${String(item.workspaceName || "")}`)
      : []),
  ]
    .filter(Boolean)
    .slice(0, 8);

  const summary =
    trustReportRequested && environmentTrustRecaps.length
      ? `Environment trust recap: ${environmentTrustRecaps
          .slice(0, 2)
          .map(
            (item) =>
              `${String(item.environment || "unknown")} score ${String(item.score ?? 0)}, active ${String(item.activeSignals ?? 0)}, archived ${String(item.completedArchived ?? 0)}`,
          )
          .join(" • ")}`
      : `${Number(digestStats.open || 0)} open notifications • ${Number(digestStats.unread || 0)} unread • ${Number(digestStats.handoffs || 0)} handoffs • ${Number(digestStats.approvals || 0)} approvals • ${Number(digestStats.ownership || 0)} ownership signals • ${Number(digestStats.trust || 0)} trust alerts`;

  const digest = recordDigestRun(actor.id, {
    summary,
    stats: digestStats,
    highlights,
    report: trustReportRequested ? formatTerminalTrustReport(overview) : "",
    reportType: trustReportRequested ? "trust" : "notification",
  });

  appendAuditEvent({
    type: "collaboration:digest-generate",
    message: `Generated notification digest ${digest.id}.`,
    payload: { actorId: actor.id, digestId: digest.id },
  });

  return digest;
}
