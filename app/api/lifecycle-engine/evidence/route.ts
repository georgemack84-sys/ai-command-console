import { NextResponse } from "next/server";
import { evidenceRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
