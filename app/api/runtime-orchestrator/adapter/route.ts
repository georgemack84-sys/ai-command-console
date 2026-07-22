import { NextResponse } from "next/server";
import { adapterRequest, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await adapterRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await adapterRequest(request)); }
