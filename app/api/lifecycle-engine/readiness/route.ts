import { NextResponse } from "next/server";
import { readinessRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await readinessRequest(request)); }
