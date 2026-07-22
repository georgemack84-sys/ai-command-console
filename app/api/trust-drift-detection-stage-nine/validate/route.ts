import { NextResponse } from "next/server";
import { requireTrustDriftDetectionStageNineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await validateRequest(request)); }
