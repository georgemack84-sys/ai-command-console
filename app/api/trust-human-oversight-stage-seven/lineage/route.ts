import { NextResponse } from "next/server";
import { lineageRequest, requireTrustHumanOversightStageSevenUser } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await lineageRequest(request)); }
