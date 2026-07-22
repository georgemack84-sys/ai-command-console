import { NextResponse } from "next/server";
import { readinessRequest, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await readinessRequest(request)); }
