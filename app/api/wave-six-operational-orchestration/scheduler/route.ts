import { NextResponse } from "next/server";
import { requireWaveSixOperationalOrchestrationUser, schedulerRequest } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await schedulerRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await schedulerRequest(request)); }
