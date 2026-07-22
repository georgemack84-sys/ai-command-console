import { NextResponse } from "next/server";
import { contractResponse, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(contractResponse()); }
