import { NextResponse } from "next/server";
import { buildDeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = buildDeploymentHardeningReadModel();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DEPLOYMENT_HARDENING_STATUS_UNAVAILABLE",
          message: error instanceof Error ? error.message : "Unable to read deployment hardening status.",
        },
      },
      { status: 500 },
    );
  }
}
