import { NextResponse } from "next/server";
import { operationalReadinessFailureAnalysisRequest, requireWaveSixDependencyServiceCoordinationUser } from "../core";

export async function GET() { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await operationalReadinessFailureAnalysisRequest()); }
export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await operationalReadinessFailureAnalysisRequest(request)); }
