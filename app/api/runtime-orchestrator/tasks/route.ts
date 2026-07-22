import { NextResponse } from "next/server";
import { requireRuntimeOrchestratorUser, tasksRequest } from "../core";

export async function GET() { await requireRuntimeOrchestratorUser(); return NextResponse.json(await tasksRequest()); }
export async function POST(request: Request) { await requireRuntimeOrchestratorUser(); return NextResponse.json(await tasksRequest(request)); }
