import { NextResponse } from "next/server";
import { buildLivenessReport } from "@/src/lib/server/health";
import { recordHandledError } from "@/services/operationalDiagnostics";
import { upsertAlert } from "@/services/alerts";

export async function GET() {
  try {
    const report = buildLivenessReport();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    recordHandledError("health", error, {}, { dedupeKey: "health:exception", cooldownMs: 60 * 1000 });
    upsertAlert("runtime_health_route_error", "high", "Liveness route failed.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, status: "error", message: "Unable to build liveness report." }, { status: 500 });
  }
}
