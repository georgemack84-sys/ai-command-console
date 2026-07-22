import { NextResponse } from "next/server";
import { checkpointsRequest, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await checkpointsRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await checkpointsRequest(request)); }
