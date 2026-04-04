import { NextResponse } from "next/server";
import { buildReadinessReport } from "@/src/lib/server/health";
import { recordHandledError } from "@/services/operationalDiagnostics";
import { upsertAlert } from "@/services/alerts";

export async function GET() {
  try {
    const report = buildReadinessReport();
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    recordHandledError("readiness", error, {}, { dedupeKey: "readiness:exception", cooldownMs: 60 * 1000 });
    upsertAlert("runtime_readiness_route_error", "high", "Readiness route failed.", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, status: "error", message: "Unable to build readiness report." }, { status: 500 });
  }
}
