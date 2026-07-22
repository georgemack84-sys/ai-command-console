import { NextResponse } from "next/server";
import { requireWaveSixOperationalOrchestrationUser, scheduleRegistryPoliciesRequest } from "../core";

export async function GET() { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await scheduleRegistryPoliciesRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalOrchestrationUser(); return NextResponse.json(await scheduleRegistryPoliciesRequest(request)); }
