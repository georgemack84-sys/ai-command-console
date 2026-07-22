import { NextResponse } from "next/server";
import { requireTrustHumanOversightStageSevenUser, resolutionRequest } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await resolutionRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await resolutionRequest(request)); }
