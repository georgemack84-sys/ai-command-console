import { NextResponse } from "next/server";
import { controlPlaneRequest, requireRuntimeOrchestratorUser } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await controlPlaneRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await controlPlaneRequest(request)); }
