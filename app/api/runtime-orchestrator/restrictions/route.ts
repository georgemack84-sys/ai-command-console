import { NextResponse } from "next/server";
import { requireRuntimeOrchestratorUser, restrictionsRequest } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await restrictionsRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await restrictionsRequest(request)); }
