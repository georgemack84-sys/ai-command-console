import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixOperationalOrchestrationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await readinessRequest(request)); }
