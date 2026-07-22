import { NextResponse } from "next/server";
import { lifecycleRequest, requireTrustHumanOversightStageSevenUser } from "../core";

export async function GET() { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireTrustHumanOversightStageSevenUser(); return NextResponse.json(await lifecycleRequest(request)); }
