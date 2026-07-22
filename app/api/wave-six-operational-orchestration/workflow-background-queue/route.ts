import { NextResponse } from "next/server";
import { requireWaveSixOperationalOrchestrationUser, workflowBackgroundQueueRequest } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await workflowBackgroundQueueRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await workflowBackgroundQueueRequest(request)); }
