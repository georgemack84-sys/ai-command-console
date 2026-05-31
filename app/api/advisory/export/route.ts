import { NextResponse } from "next/server";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";
import { buildAdvisorySnapshotExport } from "@/services/advisory/advisorySnapshotExport";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const readModel = buildAdvisoryReadModel();
    const data = buildAdvisorySnapshotExport(readModel);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ADVISORY_EXPORT_UNAVAILABLE",
          message: error instanceof Error ? error.message : "Unable to export advisory snapshot.",
        },
      },
      { status: 500 },
    );
  }
}
