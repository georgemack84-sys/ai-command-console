import { NextResponse } from "next/server";
import { coordinationEvidenceRequest, requireWaveSixOperationalOrchestrationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await coordinationEvidenceRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await coordinationEvidenceRequest(request)); }
