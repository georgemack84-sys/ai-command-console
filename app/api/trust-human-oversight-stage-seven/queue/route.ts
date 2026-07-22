import { NextResponse } from "next/server";
import { queueRequest, requireTrustHumanOversightStageSevenUser } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await queueRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await queueRequest(request)); }
