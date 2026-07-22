import { NextResponse } from "next/server";
import { evidenceRequest, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await evidenceRequest(request)); }
