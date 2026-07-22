import { NextResponse } from "next/server";
import { qualificationRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await qualificationRequest(request)); }
