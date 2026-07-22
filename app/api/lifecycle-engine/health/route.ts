import { NextResponse } from "next/server";
import { healthRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await healthRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await healthRequest(request)); }
