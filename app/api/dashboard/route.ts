import { NextResponse } from "next/server";
import { buildLiveDashboardSnapshot } from "@/services/dashboard";
import { recordHandledError } from "@/services/operationalDiagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(buildLiveDashboardSnapshot());
  } catch (error) {
    recordHandledError("dashboard-route", error, { method: "GET" }, { dedupeKey: "dashboard-route:get", cooldownMs: 60 * 1000 });
    return NextResponse.json({ error: "Unable to load dashboard data." }, { status: 500 });
  }
}
