import { NextResponse } from "next/server";
import { apisObservabilityRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await apisObservabilityRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await apisObservabilityRequest(request)); }
