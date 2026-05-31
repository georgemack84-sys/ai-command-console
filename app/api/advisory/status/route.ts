import { NextResponse } from "next/server";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = buildAdvisoryReadModel();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ADVISORY_STATUS_UNAVAILABLE",
          message: error instanceof Error ? error.message : "Unable to read advisory status.",
        },
      },
      { status: 500 },
    );
  }
}
